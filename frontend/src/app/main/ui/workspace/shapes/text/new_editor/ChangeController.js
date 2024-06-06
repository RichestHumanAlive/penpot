/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) KALEIDOS INC
 */
export class ChangeController {
  $timeout = null;
  $target = null;
  $time = 1000;
  $hasPendingChanges = false;

  /**
   *
   * @param {EventTarget} target
   * @param {number} [time=500]
   */
  constructor(target, time = 500) {
    if (!(target instanceof EventTarget)) {
      throw new TypeError("Invalid EventTarget");
    }
    this.$target = target;
    if (typeof time === "number" && (!Number.isInteger(time) || time <= 0)) {
      throw new TypeError("Invalid time");
    }
    this.$time = time ?? 500;
  }

  /**
   * Indicates that there are some pending changes.
   *
   * @type {boolean}
   */
  get hasPendingChanges() {
    return this.$hasPendingChanges;
  }

  $onTimeout = () => {
    this.$target.dispatchEvent(new Event("change"));
  };

  /**
   * Tells the ChangeController that a change has been made
   * but that you need to delay the notification (and debounce)
   * for sometime.
   */
  notifyDebounced() {
    this.$hasPendingChanges = true;
    clearTimeout(this.$timeout);
    this.$timeout = setTimeout(this.$onTimeout, this.$time);
  }

  /**
   * Tells the ChangeController that a change should be notified
   * immediately.
   */
  notifyImmediately() {
    clearTimeout(this.$timeout);
    this.$onTimeout();
  }
}

export default ChangeController;
