import { Control } from 'ol/control';
import { createElementWith, generatePointSVG } from '../utils/fns-utility';

export class Search extends Control {
  name = 'search';
  icon_: SVGElement;
  inputEl_: HTMLInputElement;
  clearBtn_: HTMLButtonElement;
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

    this.icon_ = generatePointSVG('search', false, {class:'search-icon'}) as SVGElement;

    this.inputEl_ = document.createElement('input');
    this.inputEl_.setAttribute('type','text');
    this.inputEl_.id = 'search-input';
    this.inputEl_.name = 'search-input';
    this.inputEl_.placeholder = 'Search Any Address';
    this.inputEl_.oninput = this.handleInput.bind(this);
    this.inputEl_.onkeydown = this.handleKeyDown.bind(this);

    this.clearBtn_ = document.createElement('button');
    this.clearBtn_.setAttribute('type', 'button');
    this.clearBtn_.title = 'Clear Input';
    this.clearBtn_.id = 'search-clear';
    this.clearBtn_.className = 'webmap-btn ctrl';
    this.clearBtn_.onclick = this.clearInput.bind(this);
    this.clearBtn_.appendChild(generatePointSVG('x',false));

    this.element.className = 'search-element';
    this.element.append(this.icon_, this.inputEl_, this.clearBtn_);
  }
  handleInput(e: any): void | boolean {
    const val = e.target.value;
    this.closeAllLists();
    if (!val || val === '') {
      this.clearBtn_.style.display = 'none';
      return false;
    }
    this.clearBtn_.style.display = 'flex';
    this.currentFocus = -1;
    const results = createElementWith(false, 'div', {id: e.target.id + "-results", class: 'autocomplete-items'});
    e.target.parentNode.appendChild(results);
    for (let i = 0; i < this.searchData.length; i++) {
      if (this.searchData[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        const newDiv = createElementWith(false, 'div', {
          innerHTML: '<strong>' + this.searchData[i].substr(0, val.length) + '</strong>',
          onclick:  (evt: MouseEvent) => {
            this.inputEl_.value = newDiv.getElementsByTagName('input')[0].value;
            this.closeAllLists();
          }
        });
        newDiv.innerHTML += this.searchData[i].substr(val.length);
        newDiv.innerHTML += "<input type='hidden' value='" + this.searchData[i] + "'>";
        results.appendChild(newDiv);
      }
    }
    if (results.childElementCount < 1) {
      const emptyResults = createElementWith(false, 'div', {
        innerText: 'No Results',
        className: 'empty-results',
        onclick: this.clearInput.bind(this)
      });
      results.appendChild(emptyResults);
    }
  }
  handleKeyDown(evt: any): void {
    let resultsEls: any = document.getElementById(evt.target.id + "-results");
    if (resultsEls) resultsEls = (resultsEls as HTMLElement).getElementsByTagName("div");
    if ([38,40].includes(evt.keyCode)) {
      const changeFocus = evt.keyCode === 40 ? 1 : -1;
      this.currentFocus = this.currentFocus + changeFocus;
      this.addActive(resultsEls);
    } else if (evt.keyCode == 13) {
      evt.preventDefault();
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
    this.inputEl_.value = '';
    this.clearBtn_.style.display = 'none';
    this.closeAllLists();
  }
  /* close all autocomplete lists, except one passed as arg */
  closeAllLists(currentEl?: HTMLElement): void {
    const items = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < items.length; i++) {
      if (currentEl != items[i] && currentEl != this.inputEl_) {
        items[i].parentNode?.removeChild(items[i]);
      }
    }
  }
}