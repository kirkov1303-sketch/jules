import { BiomeType } from '../world/types';

export class Toolbar {
    constructor(private onSelectPower: (type: BiomeType | string) => void) {
        this.createUI();
    }

    private createUI() {
        const div = document.createElement('div');
        div.id = 'game-toolbar';
        div.style.position = 'absolute';
        div.style.bottom = '20px';
        div.style.left = '50%';
        div.style.transform = 'translateX(-50%)';
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.padding = '15px';
        div.style.background = 'rgba(20, 20, 25, 0.85)';
        div.style.borderRadius = '12px';
        div.style.border = '2px solid #444';
        div.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
        div.style.zIndex = '100';
        div.style.flexWrap = 'wrap';
        div.style.justifyContent = 'center';
        div.style.maxWidth = '90vw';

        const powers = [
            { type: BiomeType.Ocean, label: '🌊 Океан' },
            { type: BiomeType.Plains, label: '🌱 Равнины' },
            { type: BiomeType.Desert, label: '🏜️ Пустыня' },
            { type: BiomeType.Mountain, label: '⛰️ Горы' },
            { type: BiomeType.Volcanic, label: '🌋 Вулкан' },
            { type: BiomeType.SnowyMountain, label: '❄️ Снег' },
            { type: BiomeType.Mushroom, label: '🍄 Грибы' },
            { type: BiomeType.Swamp, label: '🐊 Болото' },
            { type: 'SPAWN_HUMAN', label: '🚶 Человек' },
            { type: 'SPAWN_ORC', label: '👹 Орк' },
            { type: 'SPAWN_ELF', label: '🧝 Эльф' },
            { type: 'SPAWN_DWARF', label: '🧔 Гном' },
            { type: 'METEOR', label: '☄️ Метеор' },
            { type: 'RAIN', label: '🌧️ Дождь' },
        ];

        powers.forEach(p => {
            const btn = document.createElement('button');
            btn.innerText = p.label;
            btn.style.padding = '10px 15px';
            btn.style.cursor = 'pointer';
            btn.style.border = '1px solid #666';
            btn.style.borderRadius = '6px';
            btn.style.background = '#333';
            btn.style.color = 'white';
            btn.style.fontSize = '14px';
            btn.style.transition = 'all 0.2s';

            btn.onmouseover = () => btn.style.background = '#444';
            btn.onmouseout = () => btn.style.background = '#333';
            btn.onclick = () => {
                // Clear active state of others
                Array.from(div.querySelectorAll('button')).forEach(b => b.style.borderColor = '#666');
                btn.style.borderColor = '#00ff00';
                this.onSelectPower(p.type);
            };

            div.appendChild(btn);
        });

        document.body.appendChild(div);
    }
}
