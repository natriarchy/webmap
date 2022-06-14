import { Control } from 'ol/control';

export class Search extends Control {
  readonly name = 'search';
  readonly icons = {
    ctrl: 'search',
    clear: 'x'
  };
  _icon: HTMLElement;
  _inputEl: HTMLInputElement;
  _clearBtn: HTMLButtonElement;
  currentFocus = -1;
  searchData: Array<any> = [
    "Channel",
    "CodingLab",
    "CodingNepal",
    "YouTube",
    "YouTuber",
    "YouTube Channel",
    "Blogger",
    "Bollywood",
    "Vlogger",
    "Vechiles",
    "Facebook",
    "Freelancer",
    "Facebook Page",
    "Designer",
    "Developer",
    "Web Designer",
    "Web Developer",
    "Login Form in HTML & CSS",
    "How to learn HTML & CSS",
    "How to learn JavaScript",
    "How to became Freelancer",
    "How to became Web Designer",
    "How to start Gaming Channel",
    "How to start YouTube Channel",
    "What does HTML stands for?",
    "What does CSS stands for?"
  ];
  // set search source to default to just an address lookup, else use a clasname of a layer to search
  constructor(opts: {
    targetId?: string,
    searchSource?: Array<{source: string, name: string}>
  }) {
    super({ element: document.createElement('div') });
    this.set('name', this.name);

    this._icon = document.createElement('span');
    this._icon.className = 'bi bi-'+this.icons.ctrl;

    this._inputEl = document.createElement('input');
    this._inputEl.setAttribute('type','text');
    this._inputEl.id = 'search-input';
    this._inputEl.name = 'search-input';
    this._inputEl.placeholder = 'Search Any Address';
    this._inputEl.oninput = this.handleInput.bind(this);
    this._inputEl.onkeydown = this.handleKeyDown.bind(this);

    this._clearBtn = document.createElement('button');
    this._clearBtn.setAttribute('type', 'button');
    this._clearBtn.title = 'Clear Input';
    this._clearBtn.id = 'search-clear';
    this._clearBtn.className = 'webmap-btn ctrl';
    this._clearBtn.onclick = this.clearInput.bind(this);
    this._clearBtn.innerHTML = `<span class="bi bi-${this.icons['clear']}"></span>`;

    this.element.className = 'search-element';
    this.element.append(this._icon, this._inputEl, this._clearBtn);
  }
  handleInput(e: any): void | boolean {
    const val = e.target.value;
    this.closeAllLists();
    if (!val || val === '') {
      this._clearBtn.style.display = 'none';
      return false;
    }
    this._clearBtn.style.display = 'flex';
    this.currentFocus = -1;
    const results = document.createElement('div');
    results.id = e.target.id + "-results";
    results.className = 'autocomplete-items';
    e.target.parentNode.appendChild(results);
    for (let i = 0; i < this.searchData.length; i++) {
      if (this.searchData[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        const newDiv = document.createElement('div')
        newDiv.innerHTML = '<strong>' + this.searchData[i].substr(0, val.length) + '</strong>';
        newDiv.onclick =  (evt: MouseEvent) => {
            this._inputEl.value = newDiv.getElementsByTagName('input')[0].value;
            this.closeAllLists();
        };
        newDiv.innerHTML += this.searchData[i].substr(val.length);
        newDiv.innerHTML += "<input type='hidden' value='" + this.searchData[i] + "'>";
        results.appendChild(newDiv);
      }
    }
    if (results.childElementCount < 1) {
      const emptyResults = document.createElement('div');
      emptyResults.innerText = 'No Results';
      emptyResults.className = 'empty-results';
      emptyResults.onclick = this.clearInput.bind(this);
      results.appendChild(emptyResults);
    }
  }
  handleKeyDown(e: any): void {
    let resultsEls: any = document.getElementById(e.target.id + "-results");
    if (resultsEls) resultsEls = (resultsEls as HTMLElement).getElementsByTagName("div");
    if ([38,40].includes(e.keyCode)) {
      const changeFocus = e.keyCode === 40 ? 1 : -1;
      this.currentFocus = this.currentFocus + changeFocus;
      this.addActive(resultsEls);
    } else if (e.keyCode == 13) {
      e.preventDefault();
      if (this.currentFocus > -1 && resultsEls) resultsEls[this.currentFocus].click();
    }
  }
  setUpDataSource(sources?: Array<string>): void {

  }
  /* classify an item as "active" */
  addActive(resultsEls: any): void | false {
    if (!resultsEls) return false;
    this.removeActive(resultsEls);
    if (this.currentFocus >= resultsEls.length) this.currentFocus = 0;
    if (this.currentFocus < 0) this.currentFocus = (resultsEls.length - 1);
    resultsEls[this.currentFocus].classList.add("autocomplete-active");
  }
  /* remove "active" class from all autocomplete items */
  removeActive(x: any): void {
    for (let i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  clearInput(): void {
    this._inputEl.value = '';
    this._clearBtn.style.display = 'none';
    this.closeAllLists();
  }
  /* close all autocomplete lists, except one passed as arg */
  closeAllLists(currentEl?: HTMLElement): void {
    const items = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < items.length; i++) {
      if (currentEl != items[i] && currentEl != this._inputEl) {
        items[i].parentNode?.removeChild(items[i]);
      }
    }
  }
}
