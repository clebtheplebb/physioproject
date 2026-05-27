// Initialize namespace
window.KS = window.KS || {};

(function(KS) {
    class DamageEffects {
        constructor() {
            this.dietType = 'sodium';
            this.stageIndex = 0;
            this.pulseTime = 0;
            this.bloodPressure = 120; // Starts normal
            this.wasteUremia = 10;
            this.efficiency = 100;
        }

        setDietType(type) {
            this.dietType = type;
            this.pulseTime = 0;
            this.bloodPressure = type === 'sodium' ? 120 : 120;
            this.wasteUremia = 10;
            this.efficiency = 100;
        }

        setStage(index) {
            this.stageIndex = index;
        }

        update(dt) {
            this.pulseTime += (dt / 1000) * 4; // Frequency of pulse oscillations

            // Progressively adjust metrics based on stage index
            if (this.dietType === 'sodium') {
                // High Sodium raises blood pressure over stages
                const bpTargets = [120, 135, 155, 170, 180, 190, 195, 200];
                const effTargets = [100, 95, 88, 80, 72, 65, 58, 50];
                this.bloodPressure += (bpTargets[this.stageIndex] - this.bloodPressure) * 0.05;
                this.efficiency += (effTargets[this.stageIndex] - this.efficiency) * 0.05;
            } else if (this.dietType === 'protein') {
                // High Protein accumulates uremic toxins and drops efficiency
                const wasteTargets = [10, 15, 30, 50, 75, 90, 95];
                const effTargets = [100, 98, 85, 78, 70, 60, 55];
                this.wasteUremia += (wasteTargets[this.stageIndex] - this.wasteUremia) * 0.05;
                this.efficiency += (effTargets[this.stageIndex] - this.efficiency) * 0.05;
            }
        }

        getFlowSpeedMultiplier() {
            if (this.dietType === 'sodium') {
                // Systemic blood pressure increases, forcing faster flow rate (up to 1.5x)
                return 1.0 + (this.stageIndex / 5) * 0.5;
            } else if (this.dietType === 'protein') {
                // Slightly increased GFR after a protein-rich meal
                return 1.0 + Math.min(this.stageIndex * 0.05, 0.2);
            }
            return 1.0;
        }

        draw(ctx, camera) {
            // Under camera scale: draw visual indicators directly onto the structures
            ctx.save();

            const pulse = Math.sin(this.pulseTime) * 0.5 + 0.5; // 0 to 1

            if (this.dietType === 'sodium' && this.stageIndex >= 1) {
                // 1. Afferent/Glomerulus pressure stress glow
                ctx.strokeStyle = `rgba(231, 76, 60, ${0.15 + pulse * 0.25})`;
                ctx.lineWidth = 30;
                ctx.lineCap = 'round';
                
                // Afferent glow
                ctx.beginPath();
                ctx.moveTo(150, 250);
                ctx.bezierCurveTo(230, 260, 300, 270, 385, 280);
                ctx.stroke();

                // Glomerulus glow
                ctx.beginPath();
                ctx.arc(450, 280, 75, 0, Math.PI * 2);
                ctx.stroke();

                // Draw physical stretching pressure vectors (arrows pushing outward from glomerulus)
                if (this.stageIndex >= 2) {
                    ctx.strokeStyle = 'rgba(255, 217, 61, 0.7)';
                    ctx.lineWidth = 3;
                    const arrowLen = 15 + pulse * 5;
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2;
                        const startX = 450 + Math.cos(angle) * 70;
                        const startY = 280 + Math.sin(angle) * 70;
                        const endX = startX + Math.cos(angle) * arrowLen;
                        const endY = startY + Math.sin(angle) * arrowLen;

                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(endX, endY);
                        // Arrow tip
                        const tipAngle1 = angle + Math.PI * 0.85;
                        const tipAngle2 = angle - Math.PI * 0.85;
                        ctx.lineTo(endX + Math.cos(tipAngle1) * 6, endY + Math.sin(tipAngle1) * 6);
                        ctx.moveTo(endX, endY);
                        ctx.lineTo(endX + Math.cos(tipAngle2) * 6, endY + Math.sin(tipAngle2) * 6);
                        ctx.stroke();
                    }
                }
            }

            if (this.dietType === 'protein' && this.stageIndex >= 1) {
                // Dilated Afferent visual details (highlighting lines)
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
                ctx.lineWidth = 26;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(150, 250);
                ctx.bezierCurveTo(230, 260, 300, 270, 385, 280);
                ctx.stroke();

                // Hyperfiltration flow vectors inside glomerulus (whirling lines)
                if (this.stageIndex >= 2) {
                    ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(450, 280, 50, this.pulseTime, this.pulseTime + Math.PI * 0.5);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(450, 280, 35, -this.pulseTime, -this.pulseTime + Math.PI * 0.4);
                    ctx.stroke();
                }
            }

            // Kidney stones visualization for protein (stage 4)
            if (this.dietType === 'protein' && this.stageIndex >= 4) {
                this.drawCrystals(ctx);
            }

            ctx.restore();
        }

        drawCrystals(ctx) {
            // Draw small sharp calcium/uric crystals in Loop region (750-850, 1200-1350)
            ctx.fillStyle = '#e0f7fa';
            ctx.strokeStyle = '#80deea';
            ctx.lineWidth = 1.5;

            const crystalPts = [
                { x: 745, y: 1100 }, { x: 755, y: 1250 }, 
                { x: 780, y: 1340 }, { x: 820, y: 1330 },
                { x: 845, y: 1200 }, { x: 855, y: 950 }
            ];

            for (let pt of crystalPts) {
                ctx.save();
                ctx.translate(pt.x, pt.y);
                ctx.rotate(this.pulseTime * 0.1);
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(5, -2);
                ctx.lineTo(3, 5);
                ctx.lineTo(-3, 4);
                ctx.lineTo(-5, -2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }

        // Draw HUD Overlays (screen space, fixed overlay coordinates)
        drawOverlays(ctx, width, height) {
            ctx.save();

            // Card Panel container
            ctx.fillStyle = 'rgba(15, 20, 50, 0.8)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            
            // Draw panel top right
            ctx.fillRect(width - 240, 24, 216, 120);
            ctx.strokeRect(width - 240, 24, 216, 120);

            // Print metric titles
            ctx.font = 'bold 11px Inter';
            ctx.fillStyle = '#8892b0';
            ctx.fillText('DIETARY IMPACT DATA', width - 224, 46);

            // Render blood pressure (Sodium) or toxins (Protein)
            if (this.dietType === 'sodium') {
                ctx.font = '22px JetBrains Mono';
                ctx.fillStyle = this.bloodPressure >= 140 ? '#ff6b35' : '#e8ecf4';
                ctx.fillText(Math.round(this.bloodPressure) + ' mmHg', width - 224, 82);

                ctx.font = '11px Inter';
                ctx.fillStyle = this.bloodPressure >= 140 ? '#ff6b35' : '#8892b0';
                ctx.fillText('Systemic Blood Pressure', width - 224, 100);
            } else {
                ctx.font = '22px JetBrains Mono';
                ctx.fillStyle = this.wasteUremia >= 50 ? '#a855f7' : '#e8ecf4';
                ctx.fillText(Math.round(this.wasteUremia) + ' %', width - 224, 82);

                ctx.font = '11px Inter';
                ctx.fillStyle = this.wasteUremia >= 50 ? '#a855f7' : '#8892b0';
                ctx.fillText('Blood Uremia (Toxins)', width - 224, 100);
            }

            // Draw Kidney Efficiency progress bar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(width - 224, 116, 184, 8);
            
            const fillWidth = 184 * (this.efficiency / 100);
            let barColor = '#2ecc71';
            if (this.efficiency < 80) barColor = '#ffd700';
            if (this.efficiency < 65) barColor = '#ff6b35';

            ctx.fillStyle = barColor;
            ctx.fillRect(width - 224, 116, fillWidth, 8);

            ctx.font = '9px JetBrains Mono';
            ctx.fillStyle = '#5a6380';
            ctx.fillText('EFFICIENCY: ' + Math.round(this.efficiency) + '%', width - 224, 134);

            ctx.restore();
        }
    }

    KS.DamageEffects = DamageEffects;
})(window.KS);
