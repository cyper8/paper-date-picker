import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/iron-list/iron-list.js';
import { IronResizableBehavior } from '@polymer/iron-resizable-behavior/iron-resizable-behavior.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-styles/default-theme.js';
import '@polymer/polymer/polymer-legacy.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import { PolymerElement } from '@polymer/polymer/polymer-element.js';
class PaperYearList extends mixinBehaviors([IronResizableBehavior], PolymerElement) {
  static get template() {
    return html`
    <style>
      :host {
        display: block;
        box-sizing: border-box;
        height: 100%;
        @apply --paper-font-common-base;
        /* for iron-list to fit */
        position: relative;
      }
      .year {
        cursor: pointer;
        height: var(--paper-year-list-item-height, 44px);
        line-height: var(--paper-year-list-item-height, 44px);
        text-align: center;
        vertical-align: middle;
      }
      .selected {
        color: var(--default-primary-color);
        font-size: 24px;
      }
      iron-list {
        @apply --layout-fit;
      }
    </style>
    <iron-list id="yearList" items="[[_years]]">
      <template>
        <div class\$="year{{_addSelectedClass(selected)}}" on-tap="_tappedYearHandler">
          [[item.year]]
        </div>
      </template>
    </iron-list>
`;
  }

  static get is() { return 'paper-year-list'; }
  static get properties() {
    return {
      date: {
        type: Date,
        notify: true,
        observer: '_dateChange'
      },
      /**
       * Maximum allowed year.
       */
      max: {
        type: Number,
        value: 2100,
        observer: '_maxChange'
      },
      /**
       * Minimum allowed year.
       */
      min: {
        type: Number,
        value: 1900,
        observer: '_minChange'
      },
      /**
       * The selected year, sync with the year of the given date
       * or null if year isn't within range.
       */
      selected: {
        type: Number,
        notify: true,
        observer: '_selectedChange'
      },
      /**
       * The allowed years array.
       */
      _years: {
        type: Array,
        computed: '_computeYears(min, max)',
        readOnly: true,
        value() {
          return Date.now().getFullYear;
        }
      }
    };
  }
  ready() {
    super.ready();
    // hack for iron-list not to scroll to the first visible index on resize 
    this.$.yearList._resizeHandler = function() {
      this.debounce('resize', function() {
        this._render();
        if (this._itemsRendered && this._physicalItems && this._isVisible) {
          this._resetAverage();
          this.updateViewportBoundaries();
        }
      });
    }.bind(this.$.yearList);
  }
  /**
   * Scroll in the years list to center the selected year.
   */
  centerSelected() {
    if (this.selected !== null) {
      var selectedYearIdx = this.selected - this.min;
      this.$.yearList.scrollToIndex(selectedYearIdx);
      this.async(function() {
        var selectedPos = selectedYearIdx * this._physicalAverage + 1;
        if (selectedPos !== this.scrollTop) {
          this._update();
          this.scrollTop = selectedPos;
        }
        if (this.scrollHeight - this.offsetHeight !== this.scrollTop) {
          this.scrollTop += (this._physicalAverage - this.offsetHeight) / 2;
        }
      }.bind(this.$.yearList));
    }
  }
  /**
   * Return the selected class if needed.
   */
  _addSelectedClass(selected) {
    if (selected) {
      return ' selected';
    }
  }
  /**
   * Compute the years array passed to the iron-list.
   */
  _computeYears(min, max) {
    if (typeof min !== 'number' || typeof max !== 'number') {
      return;
    }
    var years = [];
    for (;min <= max; min++) {
      years.push({year: min});
    }
    return years;
  }
  /**
   * Set 'selected' attribute to the new date's year if it is within range, else set it to null.
   */
  _dateChange(date) {
    var newYear = date.getFullYear();
    this.selected = this._withinRange(newYear) ? newYear : null;
  }
  _maxChange(max) {
    if (typeof max !== 'number') {
      this.max = 2100;
    }
  }
  _minChange(min) {
    if (typeof min !== 'number') {
      this.min = 1900;
    }
  }
  /**
   * If selected is null, clear iron-list selection,
   * else select it in iron-list and synchronize 'date' attribute.
   */
  _selectedChange(selected) {
    if (selected === null) {
      this.$.yearList.clearSelection();
      return;
    }
    if (selected !== this.date.getFullYear()) {
      // set the year using a new Date instance for notifying to work
      this.date = new Date(this.date.setFullYear(selected));
    }
    this._selectYearInList(selected);
  }
  /**
   * Select the given year in the years list.
   */
  _selectYearInList(year) {
    var yearIdx = year - this.min;
    this.$.yearList.selectIndex(yearIdx);
  }
  /**
   * Update 'selected' attribute and select in iron-list
   * from a tapped item's event in the years list.
   */
  _tappedYearHandler(e) {
    var yearItem = e.model.item;
    var year = yearItem.year;
    if (this.selected !== year) {
      this.$.yearList.selectItem(yearItem);
      this.selected = year;
    }
  }
  /**
   * Return true if year is between min and max.
   */
  _withinRange(year) {
    return  !(this.min && year < this.min || this.max && year > this.max );
  }
}
window.customElements.define(PaperYearList.is, PaperYearList);
