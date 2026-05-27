window.KS = window.KS || {};

(function(KS) {
    class InfoBoxController {
        constructor() {
            this.overlay = document.getElementById('infoOverlay');
            this.titleEl = document.getElementById('infoTitle');
            this.bodyEl = document.getElementById('infoBody');
            this.backBtn = document.getElementById('infoBack');
            this.continueBtn = document.getElementById('infoContinue');

            this.onBack = null;
            this.onContinue = null;
            this.backBtn.addEventListener('click', () => {
                if (this.onBack) this.onBack();
            });
            this.continueBtn.addEventListener('click', () => {
                if (this.onContinue) this.onContinue();
            });

            this.initContent();
        }

        initContent() {
            this.content = {
                sodium: [
                    {
                        title: "High Sodium",
                        body: "<p>You've consumed a meal loaded with sodium. The average American eats over 3,400mg of sodium daily, more than the recommended 2,300mg limit.</p><p>Let's follow the journey of this sodium through your kidney and see the damage it causes at the cellular level...</p>"
                    },
                    {
                        title: "Glomerular Filtration",
                        body: "<p>The blood with elevated pressure goes directly to the capillaries inside the Bowman's Capsule.</p><p>These vessels are small and delicate, so the high salt levels force the kidneys to work harder. This causes hyperfiltration which damages the structural integrity of the filter units.</p>"
                    },
                    {
                        title: "Tubular Overwork",
                        body: "<p>As the filtrate passes into the Proximal Convoluted Tubule, the cells must work at maximum capacity to pump out and reabsorb this massive load of excess sodium.</p><p>The active transport pumps consume massive amounts of oxygen, leading to inflammatory stress inside the cells.</p>"
                    },
                    {
                        title: "Countercurrent Gradient",
                        body: "<p>The Loop of Henle relies on a countercurrent exchange system.</p><p>The massive sodium load overwhelms transporters in the thick ascending limb, disrupting this gradient and making it harder for the kidney to concentrate urine properly.</p>"
                    },
                    {
                        title: "Water Retention", 
                        body: "<p>With the countercurrent gradient broken and sodium levels high, the collecting duct is forced to retain more water to work.</p><p>This extra water re-enters the blood, making the hypertension cycle even worse. This perpetual pressure will end up destroying the remaining functional nephrons.</p>"
                    },
                    {
                        title: "Damage from Sodium",
                        body: "<p>Excessive sodium damages kidneys through several ways like Vessel Damage, Hyperfiltration, Inflammation, and Fluid Retention. The National Kidney Foundation recommends a daily sodium limit of under 2,300mg or 1,500mg for kidney disease patients.</p>"
                    }
                ],
                protein: [
                    {
                        title: "Excess Protein",
                        body: "<p>While protein is essential, consuming excess protein can forces your kidneys into overdrive.</p><p>The liver metabolizes surplus amino acids, creating urea that the kidneys must filter and excrete. Let's follow the protein...</p>"
                    },
                    {
                        title: "Afferent Arteriole",
                        body: "<p>To help remove excess metabolic waste, signaling molecules such as glucagon and IGF-1 trigger dilation of the afferent arteriole.<p><p>This increases blood flow into the glomerulus, allowing more filtration to occur. However, over time this increased pressure can raise intraglomerular stress and contribute to chronic damage.</p>"
                    
                    },  
                    {
                        title: "Tubular Resorption",
                        body: "<p>The Proximal Convoluted Tubule is flooded with excess amino acids and nitrogenous waste.</p><p>Tubular cells burn ATP in order to handle the load. This causes cellular damage.</p>"
                    },
                    {
                        title: "Kidney Stones",
                        body: "<p>High protein loads (especially meat proteins) increase the concentration of calcium, oxalate, and uric acid in the urine.</p><p>In the Loop of Henle, these elements form microscopic crystals, which can act as seeds for painful kidney stones.</p>"
                    },
                    {
                        title: "Uremia",
                        body: "<p>As nephrons die off, the kidney capacity gets worse. Protein wastes (urea, creatinine, uremic toxins) begin to build up in the blood stream.</p><p>This buildup (uremia) causes things like toxicity, nausea, severe fatigue, and cognitive confusion.</p>"
                    },
                    {
                        title: "Protein Overload",
                        body: "<p>Excessive protein stresses kidneys through different ways like Kidney Stones, Uremia, and Acid Stress. <p>The NIDDK recommends CKD patients limit protein to 0.6 - 0.8g/kg of body weight per day to protect kidney longevity.</p>"
                    }
                ]
            };
        }

        show(stageIndex, dietType) {
            const data = this.content[dietType][stageIndex];
            if (!data) return;

            this.titleEl.innerHTML = data.title;
            this.bodyEl.innerHTML = data.body;

            this.titleEl.className = 'info-title';
            this.titleEl.classList.add(dietType === 'sodium' ? 'sodium-title' : 'protein-title');

            this.overlay.classList.remove('hidden');
        }

        hide() {
            this.overlay.classList.add('hidden');
        }
    }

    KS.InfoBoxController = InfoBoxController;
})(window.KS);
