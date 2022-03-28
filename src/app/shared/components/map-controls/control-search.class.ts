import { Control } from 'ol/control';
import { generatePointSVG } from '../../utils/fns-utility';

export class Search extends Control {
  searchElement: HTMLDivElement;
  searchIcon: SVGSVGElement;
  searchInput: HTMLInputElement;
  searchClearBtn: HTMLButtonElement;
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
  constructor(options: { parentContainer: HTMLElement }) {
    super({ element: options.parentContainer });
    this.searchElement = document.createElement('div');
    this.searchIcon = generatePointSVG('search', false, {class:'search-icon'}) as SVGSVGElement;
    this.searchInput = document.createElement('input');
    this.searchClearBtn = document.createElement('button');

    this.searchElement.className = 'search-element';

    Object.assign(this.searchInput, {
      type: 'text',
      id: 'search-input',
      name: 'search-input',
      placeholder: 'Search Any Address'
    });
    this.searchInput.addEventListener('input', this.handleInput.bind(this), false);
    this.searchInput.addEventListener('keydown', this.handleKeyDown.bind(this), false);

    Object.assign(this.searchClearBtn, {
      type: 'button',
      title: 'Clear Input',
      id: 'search-clear',
      className: 'control-button clear-search',
      onclick: () => this.clearInput(),
      innerHTML: generatePointSVG('x',false).outerHTML
    });

    [this.searchIcon, this.searchInput, this.searchClearBtn].forEach(el => {
      this.searchElement.appendChild(el);
    });

    this.element.appendChild(this.searchElement);

    if (this.element.firstChild != this.searchElement) {
      const hrEl = document.createElement('hr');
      this.element.insertBefore(hrEl, this.searchElement);
    };
  }
  handleInput(e: any): void | boolean {
    const val = e.target.value;
    this.closeAllLists();
    if (!val || val === '') {
      this.searchClearBtn.style.display = 'none';
      return false;
    }
    this.searchClearBtn.style.display = 'flex';
    this.currentFocus = -1;
    const results = document.createElement("div");
    results.setAttribute("id", e.target.id + "-results");
    results.setAttribute("class", "autocomplete-items");
    e.target.parentNode.appendChild(results);
    for (let i = 0; i < this.searchData.length; i++) {
      if (this.searchData[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        const newDiv = document.createElement("div");
        newDiv.innerHTML = "<strong>" + this.searchData[i].substr(0, val.length) + "</strong>";
        newDiv.innerHTML += this.searchData[i].substr(val.length);
        newDiv.innerHTML += "<input type='hidden' value='" + this.searchData[i] + "'>";
        newDiv.addEventListener('click', evt => {
            this.searchInput.value = newDiv.getElementsByTagName('input')[0].value;
            this.closeAllLists();
        });
        results.appendChild(newDiv);
      }
    }
    if (results.childElementCount < 1) {
      const emptyResults = document.createElement('div');
      Object.assign(emptyResults, {
        innerText: 'No Results',
        className: 'empty-results',
        onclick: () => this.clearInput()
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
    this.searchInput.value = '';
    this.searchClearBtn.style.display = 'none';
    this.closeAllLists();
  }
  /* close all autocomplete lists, except one passed as arg */
  closeAllLists(currentEl?: HTMLElement): void {
    const items = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < items.length; i++) {
      if (currentEl != items[i] && currentEl != this.searchInput) {
        items[i].parentNode?.removeChild(items[i]);
      }
    }
  }
}
