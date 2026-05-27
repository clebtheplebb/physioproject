window.KS = window.KS || {};

(function(KS) {
    class App {
        constructor() {
            this.canvas = document.getElementById('simCanvas');
            this.ctx = this.canvas.getContext('2d');
            this.foodSelectionScreen = document.getElementById('foodSelection');
            this.foodGrid = document.getElementById('foodGrid');
            this.backBtn = document.getElementById('backButton');
            this.loadingScreen = document.getElementById('loadingScreen');

            this.eatingScene = document.getElementById('eatingScene');
            this.draggableFood = document.getElementById('draggableFood');
            this.draggableFoodImage = document.getElementById('draggableFoodImage');
            this.foodSidePanel = document.getElementById('foodSidePanel');
            this.cancelEatingBtn = document.getElementById('cancelEatingBtn');
            this.digestPath = document.getElementById('digestPath');
            this.leftKidney = document.getElementById('leftKidney');
            this.rightKidney = document.getElementById('rightKidney');
            this.silhouetteContainer = document.getElementById('silhouetteContainer');
            this.mouthTarget = document.getElementById('mouthTarget');
            this.stomachTarget = document.getElementById('stomachTarget');
            this.foodBolus = document.getElementById('foodBolus');
            this.bolusMotion = document.getElementById('bolusMotion');

            this.renderer = new KS.NephronRenderer();
            this.particles = new KS.ParticleSystem(this.renderer);
            this.animation = new KS.AnimationController();
            this.effects = new KS.DamageEffects();
            this.infobox = new KS.InfoBoxController();
            this.particleLegend = document.getElementById('particleLegend');

            this.scene = 'menu';
            this.lastTime = 0;
            this.selectedFood = null;
            this.isEatingSequencePlaying = false;
            this.bolusSequenceComplete = false;
            this.bolusFallbackTimer = null;

            this.foods = [
                { id: 'ramen', name: 'Malatang', emoji: '🍜', image: 'images/malatang.jpg', category: 'sodium', stat: '', risk: '', desc: '' },
                { id: 'pizza', name: 'Pepperoni Pizza', emoji: '🍕', image: 'images/pizza.jpg', category: 'sodium', stat: '', risk: '', desc: '' },
                { id: 'soup', name: 'Panera Tomato Soup', emoji: '🥫', image: 'images/tomato.jpg', category: 'sodium', stat: '', risk: '', desc: '' },
                { id: 'bacon', name: 'Pork Belly', emoji: '🥓', image: 'images/pork.jpg', category: 'sodium', stat: '', risk: '', desc: '' },

                { id: 'steak', name: 'Double Sirloin Steak', emoji: '🥩', image: 'images/steak.jpg', category: 'protein', stat: '', risk: '', desc: '' },
                { id: 'shake', name: 'Double CorePower Protein Shake', emoji: '🥤', image: 'images/protein.jpg', category: 'protein', stat: '', risk: '', desc: '' },
                { id: 'chicken', name: 'Lean Turkey Leg', emoji: '🍗', image: 'images/turkey.jpg', category: 'protein', stat: '', risk: '', desc: '' },
                { id: 'eggs', name: 'Egg White Scramble', emoji: '🥚', image: 'images/eggs.png', category: 'protein', stat: '', risk: '', desc: '' }
            ];

            this.initEvents();
            this.renderFoodSelection();
            this.resizeCanvas();

            setTimeout(() => {
                this.loadingScreen.classList.add('fade-out');
            }, 800);

            requestAnimationFrame((t) => this.loop(t));
        }

        initEvents() {
            window.addEventListener('resize', () => this.resizeCanvas());

            this.backBtn.addEventListener('click', () => this.showMenu());

            this.cancelEatingBtn.addEventListener('click', () => this.showMenu());

            this.animation.onStagePause = (stageIndex, dietType) => {
                this.infobox.show(stageIndex, dietType);
                this.effects.setStage(stageIndex);
            };

            this.infobox.onBack = () => this.showMenu();

            this.animation.onComplete = () => {
                this.showMenu();
            };

            if (this.bolusMotion) {
                this.bolusMotion.addEventListener('endEvent', () => this.finishEatingSequence());
            }

            this.infobox.onContinue = () => {
                this.infobox.hide();
                this.animation.nextStage();
            };

            this.initDragAndDrop();
        }

        initDragAndDrop() {
            const foodEl = this.draggableFood;
            const arena = this.eatingScene.querySelector('.eating-arena');
            let isDragging = false;
            let startX = 0;
            let startY = 0;

            const resetFoodPosition = () => {
                if (foodEl.parentElement !== this.foodSidePanel) {
                    this.foodSidePanel.appendChild(foodEl);
                }
                foodEl.classList.remove('returning', 'chomping');
                foodEl.style.transition = 'transform 0.1s ease, box-shadow var(--transition-fast), left 0.35s cubic-bezier(0.25, 1, 0.5, 1), top 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.25s ease';
                foodEl.style.position = 'absolute';
                foodEl.style.left = '50%';
                foodEl.style.top = '50%';
                foodEl.style.bottom = 'auto';
                foodEl.style.transform = 'translate(-50%, -50%)';
                foodEl.style.opacity = '1';
                foodEl.style.pointerEvents = 'auto';
            };

            const dragStart = (e) => {
                if (this.isEatingSequencePlaying) return;
                isDragging = true;
                foodEl.classList.remove('returning');

                if (foodEl.parentElement !== arena) {
                    const currentRect = foodEl.getBoundingClientRect();
                    const currentArenaRect = arena.getBoundingClientRect();
                    arena.appendChild(foodEl);
                    foodEl.style.left = `${currentRect.left - currentArenaRect.left}px`;
                    foodEl.style.top = `${currentRect.top - currentArenaRect.top}px`;
                }
                
                const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
                const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
                
                const rect = foodEl.getBoundingClientRect();
                const arenaRect = arena.getBoundingClientRect();
                
                startX = clientX - rect.left;
                startY = clientY - rect.top;

                foodEl.style.transition = 'none';
                foodEl.style.transform = 'none';
                foodEl.style.left = `${rect.left - arenaRect.left}px`;
                foodEl.style.top = `${rect.top - arenaRect.top}px`;
                foodEl.style.bottom = 'auto';
            };

            const dragMove = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                
                const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
                const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
                
                const arenaRect = arena.getBoundingClientRect();
                
                let x = clientX - arenaRect.left - startX;
                let y = clientY - arenaRect.top - startY;
                
                x = Math.max(0, Math.min(arenaRect.width - 72, x));
                y = Math.max(0, Math.min(arenaRect.height - 72, y));
                
                foodEl.style.left = `${x}px`;
                foodEl.style.top = `${y}px`;
            };

            const dragEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                
                const foodRect = foodEl.getBoundingClientRect();
                const mouthEl = document.getElementById('mouthTarget');
                const mouthRect = mouthEl.getBoundingClientRect();
                
                const foodCenterX = foodRect.left + foodRect.width / 2;
                const foodCenterY = foodRect.top + foodRect.height / 2;
                const mouthCenterX = mouthRect.left + mouthRect.width / 2;
                const mouthCenterY = mouthRect.top + mouthRect.height / 2;
                
                const dist = Math.sqrt((foodCenterX - mouthCenterX) ** 2 + (foodCenterY - mouthCenterY) ** 2);
                const hitRadius = (foodRect.width / 2) + (Math.max(mouthRect.width, mouthRect.height) / 2) + 10;
                
                if (dist <= hitRadius) {
                    foodEl.style.pointerEvents = 'none';
                    this.triggerEatingSequence();
                } else {
                    foodEl.classList.add('returning');
                    resetFoodPosition();
                }
            };

            foodEl.addEventListener('mousedown', dragStart);
            window.addEventListener('mousemove', dragMove);
            window.addEventListener('mouseup', dragEnd);

            foodEl.addEventListener('touchstart', dragStart, { passive: false });
            window.addEventListener('touchmove', dragMove, { passive: false });
            window.addEventListener('touchend', dragEnd);

            this.resetFoodPosition = resetFoodPosition;
        }

        resizeCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        renderFoodSelection() {
            this.foodGrid.innerHTML = '';

            const categories = ['sodium', 'protein'];

            for (const catKey of categories) {
                const section = document.createElement('div');
                section.className = 'food-category';

                const row = document.createElement('div');
                row.className = 'food-cards-row';

                const items = this.foods.filter(f => f.category === catKey);
                items.forEach(food => {
                    const card = document.createElement('div');
                    card.className = `food-card ${catKey}`;
                    card.innerHTML = `
                        <div class="food-image-wrap">
                            <img class="food-image" src="${encodeURI(food.image)}" alt="${food.name}">
                        </div>
                        <h3 class="food-name">${food.name}</h3>
                        <div class="food-stat ${catKey}">${food.stat}</div>
                        <div class="food-risk">
                            ${food.risk}
                        </div>
                    `;
                    card.addEventListener('click', () => this.showEatingScene(food));
                    row.appendChild(card);
                });

                section.appendChild(row);
                this.foodGrid.appendChild(section);
            }
        }

        showEatingScene(food) {
            this.selectedFood = food;
            this.scene = 'eating';
            this.isEatingSequencePlaying = false;
            this.bolusSequenceComplete = false;

            if (this.bolusFallbackTimer) {
                clearTimeout(this.bolusFallbackTimer);
                this.bolusFallbackTimer = null;
            }

            if (this.draggableFoodImage) {
                this.draggableFoodImage.src = encodeURI(food.image);
                this.draggableFoodImage.alt = food.name;
            }
            this.resetFoodPosition();

            this.digestPath.classList.remove('active');
            this.stomachTarget.classList.remove('active');
            this.leftKidney.classList.remove('active-sodium', 'active-protein');
            this.rightKidney.classList.remove('active-sodium', 'active-protein');
            this.silhouetteContainer.classList.remove('zoomed');
            this.foodBolus.classList.remove('active');
            this.foodBolus.setAttribute('opacity', '0');
            this.draggableFood.classList.remove('chomping');
            this.draggableFood.style.transform = 'translate(-50%, -50%)';
            this.draggableFood.style.opacity = '1';

            this.foodSelectionScreen.classList.add('fade-out');
            this.eatingScene.classList.remove('hidden');
            if (this.particleLegend) this.particleLegend.classList.remove('visible');
        }

        triggerEatingSequence() {
            if (this.isEatingSequencePlaying) return;
            this.isEatingSequencePlaying = true;
            this.bolusSequenceComplete = false;

            const arena = this.eatingScene.querySelector('.eating-arena');
            const arenaRect = arena.getBoundingClientRect();
            const mouthRect = this.mouthTarget.getBoundingClientRect();
            const mouthCenterX = mouthRect.left + mouthRect.width / 2 - arenaRect.left;
            const mouthCenterY = mouthRect.top + mouthRect.height / 2 - arenaRect.top;

            this.draggableFood.style.transition = 'left 0.26s cubic-bezier(0.22, 1, 0.36, 1), top 0.26s cubic-bezier(0.22, 1, 0.36, 1), transform 0.26s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease';
            this.draggableFood.style.left = `${mouthCenterX}px`;
            this.draggableFood.style.top = `${mouthCenterY}px`;
            this.draggableFood.style.transform = 'translate(-50%, -50%) scale(0.96)';
            this.draggableFood.classList.remove('returning');
            this.draggableFood.classList.add('chomping');

            setTimeout(() => {
                this.draggableFood.style.opacity = '0';
            }, 220);

            const flowColor = this.selectedFood.category === 'sodium' ? '#ff6b35' : '#a855f7';
            this.digestPath.style.stroke = flowColor;
            this.digestPath.classList.add('active');

            this.foodBolus.classList.add('active');
            this.foodBolus.setAttribute('opacity', '1');
            if (this.bolusMotion && typeof this.bolusMotion.beginElement === 'function') {
                try {
                    this.bolusMotion.beginElement();
                } catch (error) {
                }
            }

            this.bolusFallbackTimer = setTimeout(() => this.finishEatingSequence(), 1450);
        }

        finishEatingSequence() {
            if (!this.isEatingSequencePlaying || this.bolusSequenceComplete) return;
            this.bolusSequenceComplete = true;

            if (this.bolusFallbackTimer) {
                clearTimeout(this.bolusFallbackTimer);
                this.bolusFallbackTimer = null;
            }

            const kidneyClass = this.selectedFood.category === 'sodium' ? 'active-sodium' : 'active-protein';
            this.foodBolus.classList.remove('active');
            this.foodBolus.setAttribute('opacity', '0');
            this.stomachTarget.classList.add('active');
            this.leftKidney.classList.add(kidneyClass);
            this.rightKidney.classList.add(kidneyClass);

            setTimeout(() => {
                this.silhouetteContainer.classList.add('zoomed');

                setTimeout(() => {
                    this.eatingScene.classList.add('hidden');
                    this.startSimulation(this.selectedFood);
                }, 1200);
            }, 300);
        }

        startSimulation(food) {
            this.selectedFood = food;
            this.scene = 'simulation';

            this.foodSelectionScreen.classList.add('fade-out');
            this.eatingScene.classList.add('hidden');
            this.canvas.classList.add('active');
            this.backBtn.classList.remove('hidden');

            this.effects.setDietType(food.category);
            this.particles.prime(food.category);
            this.animation.start(food.category);
            if (this.particleLegend) this.particleLegend.classList.add('visible');
        }

        getActiveNephronFocus() {
            const stage = this.animation.getCurrentStage();
            const dietType = stage.dietType;
            const stageName = stage.name;

            const focusMap = {
                sodium: {
                    glomerulus: 'glomerulus',
                    pct: 'pct',
                    loop: 'descending',
                    collecting: 'collectingDuct',
                },
                protein: {
                    afferent: 'afferent',
                    pct: 'pct',
                    loop: 'descending',
                    collecting: 'collectingDuct',
                }
            };

            return focusMap[dietType]?.[stageName] || null;
        }

        showMenu() {
            this.scene = 'menu';
            this.selectedFood = null;
            this.isEatingSequencePlaying = false;

            // UI Transitions
            this.foodSelectionScreen.classList.remove('fade-out');
            this.eatingScene.classList.add('hidden');
            this.canvas.classList.remove('active');
            this.backBtn.classList.add('hidden');
            this.infobox.hide();
            if (this.particleLegend) this.particleLegend.classList.remove('visible');
        }

        loop(timestamp) {
            if (!this.lastTime) this.lastTime = timestamp;
            let dt = timestamp - this.lastTime;
            this.lastTime = timestamp;

            if (dt > 100) dt = 16.67;

            this.update(dt);
            this.draw();

            requestAnimationFrame((t) => this.loop(t));
        }

        update(dt) {
            if (this.scene !== 'simulation') return;

            this.animation.update(dt);
            this.effects.update(dt);

            const speedMult = this.effects.getFlowSpeedMultiplier();
            this.particles.setFlowSpeed(speedMult);
            
            this.particles.update(dt, this.selectedFood.category, this.animation.getCurrentStage().index);
        }

        draw() {
            const w = this.canvas.width;
            const h = this.canvas.height;

            this.ctx.fillStyle = '#f4f7fb';
            this.ctx.fillRect(0, 0, w, h);

            if (this.scene !== 'simulation') return;

            this.ctx.save();

            const cam = this.animation.getCamera();
            this.ctx.translate(w / 2, h / 2);
            this.ctx.scale(cam.zoom, cam.zoom);
            this.ctx.translate(-cam.x, -cam.y);

            const currentStageObj = this.animation.getCurrentStage();
            const damageState = {
                type: this.selectedFood.category,
                stage: currentStageObj.index,
                stageName: currentStageObj.name,
                focusSegment: this.getActiveNephronFocus()
            };
            this.renderer.draw(this.ctx, cam, damageState);

            this.particles.draw(this.ctx, cam);

            this.effects.draw(this.ctx, cam);

            this.ctx.restore();

            this.effects.drawOverlays(this.ctx, w, h);
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        KS.app = new App();
    });
})(window.KS);
