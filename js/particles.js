window.KS = window.KS || {};

(function(KS) {
    class Particle {
        constructor(type, pathType, segment, color, radius) {
            this.type = type; 
            this.pathType = pathType; 
            this.segment = segment; 
            this.t = Math.random() * 0.1;
            this.color = color;
            this.radius = radius;
            this.x = 0;
            this.y = 0;
            this.speed = 0.05 + Math.random() * 0.05;
            this.offsetX = (Math.random() - 0.5) * 12;
            this.offsetY = (Math.random() - 0.5) * 12;
            this.isReabsorbed = false;
            this.reabsorbPreference = null;
            this.reabsorptionProgress = 0;
            this.reabsorptionDir = { x: 0, y: 0 };
            this.opacity = 1.0;
        }
    }

    class ParticleSystem {
        constructor(renderer) {
            this.renderer = renderer;
            this.particles = [];
            this.flowSpeedMultiplier = 1.0;
        }

        clear() {
            this.particles = [];
        }

        setFlowSpeed(multiplier) {
            this.flowSpeedMultiplier = multiplier;
        }

        spawn(type, pathType, segment, count = 1) {
            const props = this.getParticleProps(type);
            for (let i = 0; i < count; i++) {
                const p = new Particle(type, pathType, segment, props.color, props.radius);
                p.speed = props.speed * (0.8 + Math.random() * 0.4);
                
                const seg = this.renderer.segments[segment] || this.renderer.vesselSegments[segment];
                const width = seg ? seg.width : 20;
                p.offsetX = (Math.random() - 0.5) * (width * 0.5);
                p.offsetY = (Math.random() - 0.5) * (width * 0.5);

                this.particles.push(p);
            }
        }

        getParticleProps(type) {
            switch(type) {
                case 'rbc': return { color: '#dc3545', radius: 7, speed: 0.12 };
                case 'water': return { color: '#00b4d8', radius: 3.5, speed: 0.09 };
                case 'sodium': return { color: '#ffd700', radius: 4, speed: 0.08 };
                case 'protein': return { color: '#e056a0', radius: 10, speed: 0.10 };
                case 'urea': return { color: '#8b4513', radius: 4.5, speed: 0.07 };
                case 'creatinine': return { color: '#a0522d', radius: 5, speed: 0.06 };
                default: return { color: '#ffffff', radius: 4, speed: 0.08 };
            }
        }

        update(dt, dietType, currentStage) {
            const step = (dt / 1000) * this.flowSpeedMultiplier;

            if (this.particles.filter(p => p.segment === 'afferent').length < 35) {
                this.spawn('rbc', 'blood', 'afferent', 2);
                this.spawn('water', 'blood', 'afferent', 5);
                this.spawn('sodium', 'blood', 'afferent', 3);
                this.spawn('urea', 'blood', 'afferent', 1);
                this.spawn('creatinine', 'blood', 'afferent', 1);
                
                if (dietType === 'sodium') {
                    this.spawn('sodium', 'blood', 'afferent', 8);
                    this.spawn('water', 'blood', 'afferent', 4);
                } else if (dietType === 'protein') {
                    this.spawn('protein', 'blood', 'afferent', 3);
                    this.spawn('urea', 'blood', 'afferent', 8);
                    this.spawn('creatinine', 'blood', 'afferent', 2);
                    this.spawn('water', 'blood', 'afferent', 2);
                } else {
                    this.spawn('protein', 'blood', 'afferent', 1);
                    this.spawn('urea', 'blood', 'afferent', 2);
                }
            }

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];

                if (p.isReabsorbed) {
                    p.reabsorptionProgress += step * 1.5;
                    p.x += p.reabsorptionDir.x * step * 120;
                    p.y += p.reabsorptionDir.y * step * 120;
                    p.opacity = Math.max(0, 1 - p.reabsorptionProgress);

                    if (p.reabsorptionProgress >= 1.0) {
                        p.isReabsorbed = false;
                        p.opacity = 1;
                        p.pathType = 'blood';
                        p.segment = 'peritubular';
                        p.t = Math.random() * 0.12;
                        p.speed = 0.06;
                        p.offsetX = (Math.random() - 0.5) * 6;
                        p.offsetY = (Math.random() - 0.5) * 6;
                    }
                    continue;
                }

                p.t += p.speed * step;

                this.checkContinuousExtraction(p, step, dietType);
                if (p.isReabsorbed) {
                    continue; 
                }

                while (p.t >= 1.0) {
                    p.t -= 1.0;
                    this.transitionSegment(p, dietType, currentStage);
                    if (p.isDead) {
                        this.particles.splice(i, 1);
                        break;
                    }
                }

                if (p.isDead) {
                    continue;
                }

                const basePt = this.renderer.getPoint(p.segment, p.t, p);
                
                const wiggle = Math.sin(p.t * Math.PI * 10) * 2;
                p.x = basePt.x + p.offsetX + wiggle;
                p.y = basePt.y + p.offsetY;
            }
        }

        prime(dietType) {
            this.clear();
            const originalMultiplier = this.flowSpeedMultiplier;
            this.flowSpeedMultiplier = 1.4; 
            
            for (let i = 0; i < 1500; i++) {
                this.update(16.67, dietType, 0);
            }
            
            this.flowSpeedMultiplier = originalMultiplier;
        }

        checkContinuousExtraction(p, step, dietType) {
            if (p.pathType !== 'tubule') return;

            const prob = step * 1.5;
            const sodiumDiet = dietType === 'sodium';
            const proteinDiet = dietType === 'protein';

            if (p.type === 'creatinine') {
                return;
            }

            if (p.segment === 'pct') {
                if (p.type === 'water') {
                    const waterProb = proteinDiet ? 0.28 : (sodiumDiet ? 0.2 : 0.24);
                    if (Math.random() < prob * waterProb) {
                        this.initiateReabsorption(p, { x: 0.4, y: -0.35 });
                    }
                } else if (p.type === 'sodium') {
                    const efficiency = sodiumDiet ? 0.34 : 0.2;
                    if (Math.random() < prob * efficiency) {
                        this.initiateReabsorption(p, { x: 0.45, y: -0.25 });
                    }
                } else if (p.type === 'urea' && proteinDiet) {
                    if (Math.random() < prob * 0.12) {
                        this.initiateReabsorption(p, { x: 0.25, y: -0.15 });
                    }
                }
            } else if (p.segment === 'descending') {
                if (p.type === 'water') {
                    const waterProb = sodiumDiet ? 0.32 : 0.22;
                    if (Math.random() < prob * waterProb) {
                        this.initiateReabsorption(p, { x: -0.6, y: 0.1 }); 
                    }
                } else if (p.type === 'urea' && proteinDiet) {
                    if (Math.random() < prob * 0.05) {
                        this.initiateReabsorption(p, { x: -0.15, y: 0.08 });
                    }
                }
            } else if (p.segment === 'ascending') {
                if (p.type === 'sodium') {
                    const pumpSpeed = sodiumDiet ? 0.18 : 0.55;
                    if (Math.random() < prob * pumpSpeed) {
                        this.initiateReabsorption(p, { x: 0.6, y: -0.1 }); 
                    }
                } else if (p.type === 'water' && proteinDiet) {
                    if (Math.random() < prob * 0.08) {
                        this.initiateReabsorption(p, { x: -0.25, y: -0.08 });
                    }
                }
            } else if (p.segment === 'dct') {
                if (p.type === 'water') {
                    const waterProb = sodiumDiet ? 0.48 : (proteinDiet ? 0.18 : 0.32);
                    if (Math.random() < prob * waterProb) {
                        this.initiateReabsorption(p, { x: 0.25, y: -0.4 });
                    }
                } else if (p.type === 'sodium') {
                    const saltProb = sodiumDiet ? 0.02 : 0.18;
                    if (Math.random() < prob * saltProb) {
                        this.initiateReabsorption(p, { x: 0.35, y: -0.2 });
                    }
                }
            } else if (p.segment === 'collectingDuct') {
                if (p.type === 'water') {
                    const waterProb = sodiumDiet ? 0.7 : (proteinDiet ? 0.1 : 0.22);
                    if (Math.random() < prob * waterProb) {
                        this.initiateReabsorption(p, { x: 0.2, y: -0.45 });
                    }
                } else if (p.type === 'sodium') {
                    const saltProb = sodiumDiet ? 0.01 : 0.08;
                    if (Math.random() < prob * saltProb) {
                        this.initiateReabsorption(p, { x: 0.25, y: -0.12 });
                    }
                }
            }
        }

        getReabsorptionPreference(type, dietType) {
            if (type === 'rbc' || type === 'protein' || type === 'creatinine') return false;

            if (dietType === 'sodium') {
                switch (type) {
                    case 'water': return Math.random() < 0.82;
                    case 'sodium': return Math.random() < 0.66;
                    case 'urea': return Math.random() < 0.25;
                    default: return Math.random() < 0.5;
                }
            }

            if (dietType === 'protein') {
                switch (type) {
                    case 'water': return Math.random() < 0.68;
                    case 'sodium': return Math.random() < 0.5;
                    case 'urea': return Math.random() < 0.32;
                    default: return Math.random() < 0.45;
                }
            }

            switch (type) {
                case 'water': return Math.random() < 0.62;
                case 'sodium': return Math.random() < 0.52;
                case 'urea': return Math.random() < 0.28;
                default: return Math.random() < 0.4;
            }
        }

        transitionSegment(p, dietType, currentStage) {
            if (p.pathType === 'blood') {
                if (p.segment === 'afferent') {
                    p.segment = 'glomerulus';
                    p.speed = 0.22; 
                } else if (p.segment === 'glomerulus') {
                    const isFiltered = this.checkFiltration(p, dietType, currentStage);
                    if (isFiltered) {
                        p.pathType = 'tubule';
                        p.segment = 'bowmans';
                        p.reabsorbPreference = this.getReabsorptionPreference(p.type, dietType);
                        p.speed = 0.09;
                        p.side = Math.random() > 0.5 ? 1 : -1; 
                        p.offsetX = (Math.random() - 0.5) * 6;
                        p.offsetY = (Math.random() - 0.5) * 6;
                    } else {
                        p.segment = 'efferent';
                        p.speed = 0.15;
                    }
                } else if (p.segment === 'efferent') {
                    p.segment = 'peritubular';
                    p.speed = 0.06;
                } else if (p.segment === 'peritubular') {
                    if (Math.random() > 0.55) {
                        p.segment = 'vasaRecta';
                        p.speed = 0.04;
                    } else {
                        p.isDead = true;
                    }
                } else if (p.segment === 'vasaRecta') {
                    p.isDead = true;
                }
            }
            else if (p.pathType === 'tubule') {
                if (p.segment === 'bowmans') {
                    p.segment = 'pct';
                    p.speed = 0.07;
                } else if (p.segment === 'pct') {
                    p.segment = 'descending';
                    p.speed = 0.05;
                } else if (p.segment === 'descending') {
                    p.segment = 'hairpin';
                    p.speed = 0.12;
                } else if (p.segment === 'hairpin') {
                    p.segment = 'ascending';
                    p.speed = 0.06;
                } else if (p.segment === 'ascending') {
                    p.segment = 'dct';
                    p.speed = 0.08;
                } else if (p.segment === 'dct') {
                    p.segment = 'collectingDuct';
                    p.speed = 0.05;
                } else if (p.segment === 'collectingDuct') {
                    p.isDead = true; 
                }
            }
        }

        checkFiltration(p, dietType, currentStage) {
            if (p.type === 'rbc' || p.type === 'protein') return false;

            return true;
        }

        initiateReabsorption(p, direction) {
            p.isReabsorbed = true;
            p.reabsorptionProgress = 0;
            p.reabsorptionDir = direction;
        }

        draw(ctx, camera) {
            ctx.save();
            
            for (let p of this.particles) {
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;

                ctx.beginPath();
                if (p.type === 'rbc') {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.t * Math.PI * 2);
                    ctx.ellipse(0, 0, p.radius * 1.3, p.radius * 0.7, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                } else if (p.type === 'protein') {
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 8;
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0; 
                } else if (p.type === 'sodium') {
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();

                    if (camera.zoom > 1.4) {
                        ctx.fillStyle = '#111';
                        ctx.font = 'bold 7px Inter';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('+', p.x, p.y);
                    }
                } else {
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }
    }

    KS.ParticleSystem = ParticleSystem;
})(window.KS);
