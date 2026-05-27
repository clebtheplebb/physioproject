// Initialize namespace
window.KS = window.KS || {};

(function(KS) {
    class NephronRenderer {
        constructor() {
            this.segments = {};
            this.vesselSegments = {};
            this.initPaths();
        }

        initPaths() {
            // Coordinate system: virtual 2000 x 1600
            // Cortex: y = 0 to 550
            // Medulla: y = 550 to 1600

            // 1. Afferent Arteriole (flows into glomerulus)
            this.vesselSegments.afferent = {
                type: 'bezier',
                width: 14,
                color: 'rgba(200, 100, 90, 0.25)',
                label: 'Afferent Arteriole',
                points: [
                    { x: 150, y: 250 }, // Start
                    { x: 230, y: 260 }, // Control 1
                    { x: 300, y: 270 }, // Control 2
                    { x: 385, y: 280 }  // End (Glomerulus entry)
                ]
            };

            // 2. Glomerulus: Capillary Tuft inside Bowman's Capsule (complex loop drawing)
            // It will be represented by multiple sub-loops.
            this.vesselSegments.glomerulus = {
                type: 'glomerulus',
                center: { x: 450, y: 280 },
                radius: 65,
                color: 'rgba(200, 100, 100, 0.35)',
                width: 6,
                label: 'Glomerulus'
            };

            // 3. Bowman's Capsule (surrounds glomerulus)
            this.segments.bowmans = {
                type: 'bowmans',
                center: { x: 450, y: 280 },
                radius: 90,
                color: 'rgba(200, 180, 100, 0.15)',
                width: 5,
                label: "Bowman's Capsule"
            };

            // 4. Efferent Arteriole (exits glomerulus)
            this.vesselSegments.efferent = {
                type: 'bezier',
                width: 10,
                color: 'rgba(200, 100, 90, 0.25)',
                label: 'Efferent Arteriole',
                points: [
                    { x: 505, y: 260 },
                    { x: 550, y: 230 },
                    { x: 610, y: 230 },
                    { x: 650, y: 250 }
                ]
            };

            // 5. Proximal Convoluted Tubule (PCT) - Highly coiled
            this.segments.pct = {
                type: 'bezier',
                width: 28,
                color: 'rgba(100, 140, 200, 0.15)',
                label: 'Proximal Convoluted Tubule',
                points: [
                    { x: 450, y: 370 }, // Start at bottom of Bowman's
                    { x: 450, y: 440 }, { x: 510, y: 460 }, { x: 540, y: 400 }, // Loop 1
                    { x: 570, y: 340 }, { x: 640, y: 340 }, { x: 650, y: 400 }, // Loop 2
                    { x: 660, y: 460 }, { x: 710, y: 480 }, { x: 750, y: 500 }  // Transition to loop
                ]
            };

            // 6. Descending Loop of Henle (down into Medulla)
            this.segments.descending = {
                type: 'line',
                width: 14, // Thinner
                color: 'rgba(100, 140, 200, 0.12)',
                label: 'Descending Loop of Henle (Thin)',
                points: [
                    { x: 750, y: 500 },
                    { x: 750, y: 1300 }
                ]
            };

            // 7. Hairpin Turn (deep in Medulla)
            this.segments.hairpin = {
                type: 'bezier',
                width: 14,
                color: 'rgba(100, 140, 200, 0.12)',
                label: 'Loop Hairpin Turn',
                points: [
                    { x: 750, y: 1300 },
                    { x: 750, y: 1360 }, { x: 850, y: 1360 }, { x: 850, y: 1300 }
                ]
            };

            // 8. Ascending Loop of Henle (rises back up, becomes thick segment)
            this.segments.ascending = {
                type: 'line',
                width: 22, // Thick ascending limb (TAL)
                color: 'rgba(100, 180, 140, 0.15)',
                label: 'Ascending Loop of Henle (Thick)',
                points: [
                    { x: 850, y: 1300 },
                    { x: 850, y: 500 }
                ]
            };

            // 9. Distal Convoluted Tubule (DCT) - Coiled, returns near Bowman's
            this.segments.dct = {
                type: 'bezier',
                width: 24,
                color: 'rgba(100, 180, 140, 0.15)',
                label: 'Distal Convoluted Tubule',
                points: [
                    { x: 850, y: 500 },
                    { x: 850, y: 420 }, { x: 780, y: 380 }, { x: 740, y: 420 }, // Coil 1
                    { x: 700, y: 460 }, { x: 620, y: 460 }, { x: 590, y: 420 }, // Coil 2
                    { x: 560, y: 380 }, { x: 550, y: 420 }, { x: 550, y: 480 }  // Transition to collecting duct
                ]
            };

            // 10. Collecting Duct (descends through Medulla)
            this.segments.collectingDuct = {
                type: 'line',
                width: 32, // Large collecting duct
                color: 'rgba(200, 150, 100, 0.15)',
                label: 'Collecting Duct',
                points: [
                    { x: 550, y: 480 },
                    { x: 550, y: 1550 }
                ]
            };

            // 11. Peritubular Capillaries (branch from Efferent, wrap PCT/DCT)
            this.vesselSegments.peritubular = {
                type: 'bezier',
                width: 6,
                color: 'rgba(200, 100, 90, 0.1)',
                label: 'Peritubular Capillaries',
                points: [
                    { x: 650, y: 250 },
                    { x: 700, y: 300 }, { x: 600, y: 350 }, { x: 500, y: 380 },
                    { x: 400, y: 410 }, { x: 480, y: 460 }, { x: 600, y: 480 },
                    { x: 690, y: 450 }, { x: 730, y: 490 }, { x: 780, y: 520 }
                ]
            };

            // 12. Vasa Recta (branches from Peritubular/Efferent, runs down with loop)
            this.vesselSegments.vasaRecta = {
                type: 'vasaRecta',
                width: 6,
                color: 'rgba(200, 100, 90, 0.12)',
                label: 'Vasa Recta',
                points: [
                    { x: 780, y: 520 }, // Entry point near descending loop
                    { x: 780, y: 1280 }, // Descend
                    { x: 780, y: 1330 }, { x: 820, y: 1330 }, { x: 820, y: 1280 }, // Hairpin loop
                    { x: 820, y: 520 }  // Ascend (runs near ascending limb, returns to vein)
                ]
            };
        }

        // Helper to evaluate a point at time 't' (0 to 1) along a bezier segment
        getBezierPoint(pts, t) {
            const n = pts.length - 1;
            if (n === 3) {
                // Cubic Bezier
                const u = 1 - t;
                const tt = t * t;
                const uu = u * u;
                const uuu = uu * u;
                const ttt = tt * t;

                return {
                    x: uuu * pts[0].x + 3 * uu * t * pts[1].x + 3 * u * tt * pts[2].x + ttt * pts[3].x,
                    y: uuu * pts[0].y + 3 * uu * t * pts[1].y + 3 * u * tt * pts[2].y + ttt * pts[3].y
                };
            } else if (n > 3) {
                // Chained Beziers (4 points per segment)
                // Assume pts has 4, 7, 10, 13... points
                const numSections = Math.floor(n / 3);
                let sec = Math.floor(t * numSections);
                if (sec >= numSections) sec = numSections - 1;
                const localT = (t * numSections) - sec;
                const idx = sec * 3;
                return this.getBezierPoint([pts[idx], pts[idx+1], pts[idx+2], pts[idx+3]], localT);
            }
            return pts[0];
        }

        // Evaluate point at time 't' on linear segment
        getLinePoint(pts, t) {
            const start = pts[0];
            const end = pts[1];
            return {
                x: start.x + (end.x - start.x) * t,
                y: start.y + (end.y - start.y) * t
            };
        }

        getVasaRectaPoint(pts, t) {
            // Decides path through Vasa Recta points
            // 4 points representing descending, curve, ascending
            if (t < 0.45) {
                // Descending leg
                const nt = t / 0.45;
                return this.getLinePoint([pts[0], pts[1]], nt);
            } else if (t < 0.55) {
                // Curve
                const nt = (t - 0.45) / 0.1;
                return this.getBezierPoint([pts[1], pts[2], pts[3], pts[4]], nt);
            } else {
                // Ascending leg
                const nt = (t - 0.55) / 0.45;
                return this.getLinePoint([pts[4], pts[5]], nt);
            }
        }

        // Generic getPoint API
        getPoint(segmentName, t, p) {
            t = Math.max(0, Math.min(1, t));
            const seg = this.segments[segmentName] || this.vesselSegments[segmentName];
            if (!seg) return { x: 0, y: 0 };

            if (seg.type === 'line') {
                return this.getLinePoint(seg.points, t);
            } else if (seg.type === 'bezier') {
                return this.getBezierPoint(seg.points, t);
            } else if (seg.type === 'vasaRecta') {
                return this.getVasaRectaPoint(seg.points, t);
            } else if (seg.type === 'bowmans') {
                // Flow from top/sides down to the bottom exit (450, 370)
                const side = (p && p.side) ? p.side : 1;
                let angle;
                if (side === -1) {
                    // Left side: flow from 1.15 * PI down to 0.52 * PI
                    angle = (1.15 - 0.63 * t) * Math.PI;
                } else {
                    // Right side: flow from 1.85 * PI up to 2.48 * PI
                    angle = (1.85 + 0.63 * t) * Math.PI;
                }
                return {
                    x: seg.center.x + Math.cos(angle) * (seg.radius - 12),
                    y: seg.center.y + Math.sin(angle) * (seg.radius - 12)
                };
            } else if (seg.type === 'glomerulus') {
                // Arbitrary looping coordinates for capillary flow inside glomerulus
                // 3 loops
                const angle = t * Math.PI * 6;
                const offsetRadius = seg.radius * 0.7 * (0.5 + 0.5 * Math.sin(t * Math.PI));
                return {
                    x: seg.center.x + Math.cos(angle) * offsetRadius,
                    y: seg.center.y + Math.sin(angle) * offsetRadius
                };
            }
            return { x: 0, y: 0 };
        }

        // Return camera target coordinates for a specific segment focus
        getSegmentBounds(segmentName) {
            const seg = this.segments[segmentName] || this.vesselSegments[segmentName];
            if (!seg) return { x: 1000, y: 800, zoom: 0.5 };

            if (segmentName === 'glomerulus' || segmentName === 'bowmans' || segmentName === 'afferent') {
                return { x: 380, y: 280, zoom: 1.6 };
            } else if (segmentName === 'pct') {
                return { x: 600, y: 400, zoom: 1.4 };
            } else if (segmentName === 'descending' || segmentName === 'ascending' || segmentName === 'hairpin') {
                return { x: 800, y: 900, zoom: 0.8 };
            } else if (segmentName === 'dct') {
                return { x: 700, y: 440, zoom: 1.4 };
            } else if (segmentName === 'collectingDuct') {
                return { x: 550, y: 1000, zoom: 0.8 };
            }
            return { x: 1000, y: 800, zoom: 0.5 };
        }

        drawPathOutline(ctx, seg, customColor, customWidth) {
            const color = customColor || seg.color;
            const width = customWidth || seg.width;

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (seg.type === 'line') {
                ctx.moveTo(seg.points[0].x, seg.points[0].y);
                ctx.lineTo(seg.points[1].x, seg.points[1].y);
                ctx.stroke();
            } else if (seg.type === 'bezier') {
                ctx.moveTo(seg.points[0].x, seg.points[0].y);
                for (let i = 1; i < seg.points.length; i += 3) {
                    ctx.bezierCurveTo(
                        seg.points[i].x, seg.points[i].y,
                        seg.points[i+1].x, seg.points[i+1].y,
                        seg.points[i+2].x, seg.points[i+2].y
                    );
                }
                ctx.stroke();
            } else if (seg.type === 'vasaRecta') {
                // Draw U-shape
                ctx.moveTo(seg.points[0].x, seg.points[0].y);
                ctx.lineTo(seg.points[1].x, seg.points[1].y);
                ctx.bezierCurveTo(
                    seg.points[2].x, seg.points[2].y,
                    seg.points[3].x, seg.points[3].y,
                    seg.points[4].x, seg.points[4].y
                );
                ctx.lineTo(seg.points[5].x, seg.points[5].y);
                ctx.stroke();
            } else if (seg.type === 'bowmans') {
                // Draw C-shaped double-walled capsule cup
                ctx.beginPath();
                ctx.arc(seg.center.x, seg.center.y, seg.radius, 0.85 * Math.PI, 2.15 * Math.PI, true);
                ctx.strokeStyle = color;
                ctx.lineWidth = 12;
                ctx.stroke();

                // Draw outer wall
                ctx.beginPath();
                ctx.arc(seg.center.x, seg.center.y, seg.radius + 15, 0.85 * Math.PI, 2.15 * Math.PI, true);
                ctx.strokeStyle = 'rgba(74, 158, 255, 0.25)';
                ctx.lineWidth = 4;
                ctx.stroke();
            }
        }

        drawHighlightedPath(ctx, seg) {
            if (!seg) return;
            this.drawPathOutline(ctx, seg, 'rgba(255, 255, 255, 0.85)', seg.width + 8);
            this.drawPathOutline(ctx, seg, 'rgba(240, 207, 79, 0.95)', seg.width + 2);
        }

        draw(ctx, camera, damageState) {
            // 1. Draw Medulla Gradient (salty gradient)
            const gradient = ctx.createLinearGradient(0, 550, 0, 1600);
            gradient.addColorStop(0, 'rgba(225, 233, 245, 0.95)');
            gradient.addColorStop(0.5, 'rgba(214, 226, 241, 0.98)');
            gradient.addColorStop(1, 'rgba(202, 217, 237, 1)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 550, 2000, 1050);

            // Draw Cortex Background
            ctx.fillStyle = 'rgba(248, 250, 253, 1)';
            ctx.fillRect(0, 0, 2000, 550);

            // Zone boundary line
            ctx.beginPath();
            ctx.moveTo(0, 550);
            ctx.lineTo(2000, 550);
            ctx.strokeStyle = 'rgba(24, 34, 51, 0.12)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw labels for zones
            ctx.fillStyle = 'rgba(24, 34, 51, 0.52)';
            ctx.font = 'bold 24px Inter';
            ctx.fillText('RENAL CORTEX', 50, 60);
            ctx.fillText('RENAL MEDULLA', 50, 600);

            // Side osmolarity labels removed per UI preference

            // 2. Draw Tubules (Back layer)
            // Draw Bowman's first
            this.drawPathOutline(ctx, this.segments.bowmans);

            // Draw PCT
            let pctColor = null;
            if (damageState && damageState.type === 'sodium' && damageState.stage >= 4) {
                pctColor = 'rgba(231, 76, 60, 0.8)'; // Sodium inflammation
            } else if (damageState && damageState.type === 'protein' && damageState.stage >= 3) {
                pctColor = 'rgba(168, 85, 247, 0.8)'; // Protein stress
            }
            this.drawPathOutline(ctx, this.segments.pct, pctColor);

            // Draw Loop descending
            this.drawPathOutline(ctx, this.segments.descending);
            this.drawPathOutline(ctx, this.segments.hairpin);
            
            // Draw Loop ascending
            this.drawPathOutline(ctx, this.segments.ascending);

            // Draw DCT
            this.drawPathOutline(ctx, this.segments.dct);

            // Draw Collecting Duct
            this.drawPathOutline(ctx, this.segments.collectingDuct);

            // 3. Draw Vessels
            // Draw Afferent
            let affWidth = this.vesselSegments.afferent.width;
            if (damageState && damageState.type === 'protein' && damageState.stage >= 1) {
                affWidth = 24; // Dilation
            }
            this.drawPathOutline(ctx, this.vesselSegments.afferent, null, affWidth);

            // Draw Glomerulus capillary tuft
            this.drawGlomerulus(ctx, damageState);

            // Draw Efferent
            this.drawPathOutline(ctx, this.vesselSegments.efferent);

            // Draw Peritubular Capillaries
            this.drawPathOutline(ctx, this.vesselSegments.peritubular, 'rgba(231, 76, 60, 0.5)', 6);

            // Draw Vasa Recta
            this.drawPathOutline(ctx, this.vesselSegments.vasaRecta, 'rgba(231, 76, 60, 0.55)', 6);

            if (damageState && damageState.focusSegment) {
                const focusSeg = this.segments[damageState.focusSegment] || this.vesselSegments[damageState.focusSegment];
                this.drawHighlightedPath(ctx, focusSeg);
            }

            // Draw Labels (only when zoomed out or nearby)
            if (camera.zoom < 1.0) {
                this.drawLabels(ctx);
            }
        }

        drawGlomerulus(ctx, damageState) {
            const seg = this.vesselSegments.glomerulus;
            ctx.save();
            ctx.beginPath();
            ctx.arc(seg.center.x, seg.center.y, seg.radius, 0, Math.PI * 2);
            ctx.clip();

            // Draw internal capillary loops
            ctx.strokeStyle = seg.color;
            ctx.lineWidth = seg.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Custom loop drawing
            ctx.beginPath();
            // Loop 1
            ctx.arc(seg.center.x - 20, seg.center.y - 15, 25, 0, Math.PI * 2);
            // Loop 2
            ctx.arc(seg.center.x + 20, seg.center.y - 10, 25, 0, Math.PI * 2);
            // Loop 3
            ctx.arc(seg.center.x, seg.center.y + 20, 25, 0, Math.PI * 2);
            // Connect loops
            ctx.moveTo(seg.center.x - 30, seg.center.y - 30);
            ctx.bezierCurveTo(seg.center.x - 5, seg.center.y - 45, seg.center.x + 5, seg.center.y - 45, seg.center.x + 30, seg.center.y - 30);
            ctx.stroke();

            // Glomerular membrane damage visual overlays
            if (damageState && damageState.stage >= 2) {
                if (damageState.type === 'sodium') {
                    // Draw red stress cracking/pressure indicator
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                    ctx.lineWidth = 3;
                    for (let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        const angle = Math.random() * Math.PI * 2;
                        const start = {
                            x: seg.center.x + Math.cos(angle) * (seg.radius * 0.4),
                            y: seg.center.y + Math.sin(angle) * (seg.radius * 0.4)
                        };
                        ctx.moveTo(start.x, start.y);
                        ctx.lineTo(start.x + (Math.random() - 0.5) * 30, start.y + (Math.random() - 0.5) * 30);
                        ctx.stroke();
                    }
                } else if (damageState.type === 'protein') {
                    // Hyperfiltration accelerated visual (bright flashing yellow lines)
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.lineWidth = 1.5;
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(seg.center.x, seg.center.y, seg.radius * 0.6, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            ctx.restore();

            // Bowman's space outline
            ctx.beginPath();
            ctx.arc(seg.center.x, seg.center.y, seg.radius + 15, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 217, 61, 0.3)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        drawLabels(ctx) {
            ctx.fillStyle = '#000000';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 3;
            ctx.font = 'bold 16px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Place text slightly offset from typical centers
            const drawLabel = (text, x, y) => {
                ctx.strokeText(text, x, y);
                ctx.fillText(text, x, y);
            };

            drawLabel("Bowman's Capsule", 320, 180);
            drawLabel("Glomerulus", 450, 285);
            drawLabel("Afferent Arteriole", 220, 220);
            drawLabel("Efferent Arteriole", 610, 200);
            drawLabel("Proximal Convoluted Tubule (PCT)", 550, 310);
            drawLabel("Descending Loop (Thin)", 630, 700);
            drawLabel("Ascending Loop (Thick)", 970, 700);
            drawLabel("Distal Convoluted Tubule (DCT)", 750, 350);
            drawLabel("Collecting Duct", 440, 1000);
        }
    }

    KS.NephronRenderer = NephronRenderer;
})(window.KS);
