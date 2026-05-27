// Initialize namespace
window.KS = window.KS || {};

(function(KS) {
    class AnimationController {
        constructor() {
            this.dietType = 'sodium'; // 'sodium' or 'protein'
            this.stageIndex = 0;
            this.isPaused = false;
            this.completed = false;

            // Camera: virtual coordinates (2000 x 1600)
            this.camera = {
                x: 1000,
                y: 800,
                zoom: 0.5,
                targetX: 1000,
                targetY: 800,
                targetZoom: 0.5
            };

            this.onStagePause = null; // Callback when a stage pauses
            this.onComplete = null;  // Callback when timeline completes

            this.stages = {
                sodium: [
                    { name: 'intro', focus: { x: 1000, y: 800, zoom: 0.5 } },
                    { name: 'glomerulus', focus: { x: 450, y: 280, zoom: 2.3 } },
                    { name: 'pct', focus: { x: 600, y: 410, zoom: 1.4 } },
                    { name: 'loop', focus: { x: 800, y: 900, zoom: 0.75 } },
                    { name: 'collecting', focus: { x: 550, y: 1000, zoom: 0.75 } },
                    { name: 'summary', focus: { x: 1000, y: 800, zoom: 0.5 } }
                ],
                protein: [
                    { name: 'intro', focus: { x: 1000, y: 800, zoom: 0.5 } },
                    { name: 'afferent', focus: { x: 230, y: 260, zoom: 1.8 } },
                    { name: 'pct', focus: { x: 600, y: 410, zoom: 1.4 } },
                    { name: 'loop', focus: { x: 800, y: 900, zoom: 0.75 } },
                    { name: 'collecting', focus: { x: 550, y: 1000, zoom: 0.75 } },
                    { name: 'summary', focus: { x: 1000, y: 800, zoom: 0.5 } }
                ]
            };

            this.stageTransitionTimer = 0;
            this.transitionDuration = 2.0; // 2 seconds camera pan
        }

        start(dietType) {
            this.dietType = dietType;
            this.stageIndex = 0;
            this.isPaused = false;
            this.completed = false;

            // Reset camera instantly on start
            const currentStages = this.stages[this.dietType];
            const startFocus = currentStages[0].focus;
            this.camera.x = startFocus.x;
            this.camera.y = startFocus.y;
            this.camera.zoom = startFocus.zoom;
            this.camera.targetX = startFocus.x;
            this.camera.targetY = startFocus.y;
            this.camera.targetZoom = startFocus.zoom;

            this.triggerStagePause();
        }

        update(dt) {
            // Smoothly Lerp Camera to targets
            // Using frame independent interpolation factor
            const t = 1 - Math.pow(0.001, dt / 1000); // Decays towards target
            const lerpFactor = Math.min(1, t * 15); // Adjust speed factor

            this.camera.x += (this.camera.targetX - this.camera.x) * lerpFactor;
            this.camera.y += (this.camera.targetY - this.camera.y) * lerpFactor;
            this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * lerpFactor;

            // Update transition timers
            if (this.stageTransitionTimer > 0 && !this.isPaused) {
                this.stageTransitionTimer -= dt / 1000;
                if (this.stageTransitionTimer <= 0) {
                    this.triggerStagePause();
                }
            }
        }

        nextStage() {
            const currentStages = this.stages[this.dietType];
            if (this.stageIndex < currentStages.length - 1) {
                this.stageIndex++;
                this.isPaused = false;

                // Move camera target
                const stage = currentStages[this.stageIndex];
                this.camera.targetX = stage.focus.x;
                this.camera.targetY = stage.focus.y;
                this.camera.targetZoom = stage.focus.zoom;

                // Trigger timer for when camera completes panning, then show info box
                this.stageTransitionTimer = this.transitionDuration;
            } else {
                this.completed = true;
                if (this.onComplete) {
                    this.onComplete();
                }
            }
        }

        triggerStagePause() {
            this.isPaused = true;
            if (this.onStagePause) {
                this.onStagePause(this.stageIndex, this.dietType);
            }
        }

        pause() {
            this.isPaused = true;
        }

        resume() {
            this.isPaused = false;
        }

        getCurrentStage() {
            const currentStages = this.stages[this.dietType];
            return {
                name: currentStages[this.stageIndex].name,
                index: this.stageIndex,
                total: currentStages.length,
                dietType: this.dietType
            };
        }

        getCamera() {
            return this.camera;
        }
    }

    KS.AnimationController = AnimationController;
})(window.KS);
