// engine/inventory.js
// Mini inventário: estado real (itens recolhidos) + UI no canto inferior direito.

class Inventory {
  constructor(rootEl) {
    this.root = rootEl;
    this.items = [];
    this.root.innerHTML='<button class="inv-bag" aria-label="Abrir bolso do moletom (I)" title="Bolso do moletom · I"><span class="hoodie-art" role="img" aria-label="Moletom com bolso vazio"></span><span class="hoodie-unread" hidden></span><span class="hoodie-label"><kbd>I</kbd> BOLSO</span></button><div class="inv-slots" hidden></div>';
    this.slotsEl = rootEl.querySelector('.inv-slots');
    this.render();
  }

  has(itemId) { return this.items.some((i) => i.id === itemId); }

  add(item) {
    if (this.has(item.id)) return false;
    this.items.push(item);
    this.render();
    return true;
  }

  render() {
    this.slotsEl.innerHTML = '';
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.setAttribute('aria-label', this.items.length ? 'Abrir celular' : 'Bolso vazio');
    slot.onclick = () => this.onUse?.(this.items.find(i=>i.id==='celular'));
    slot.className = 'inv-slot' + (this.items.length ? ' filled' : '');
    const item = this.items.find(i=>i.id==='celular');
    if (item) {
      const img = document.createElement('img');
      img.src = item.icon; img.alt = item.name; img.title = item.name;
      slot.appendChild(img);
    }
    this.slotsEl.appendChild(slot);
    this.root.dataset.count = String(this.items.length);
    const owned=this.has('celular');
    const art=this.root.querySelector('.hoodie-art');
    art.classList.toggle('has-phone',owned);
    art.setAttribute('aria-label',owned?'Moletom com celular no bolso':'Moletom com bolso vazio');
  }

  setVisible(v) { this.root.classList.toggle('hidden', !v); }
}

if (typeof module !== 'undefined') module.exports = Inventory;
