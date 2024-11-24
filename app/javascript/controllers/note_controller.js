import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="note"
export default class extends Controller {
  static values = {
    activeObject: Object
  }

  connect() {
  }

  blurBackground(event) {
    const turboElement = event.target.parentNode;
    const currentElement = turboElement.parentElement;
    const blurMe = ["header", "new-note", "single-note"]; // XXX: move up to the top level?
    this.activeObjectValue = currentElement.getBoundingClientRect();

    blurMe.forEach(element => {
      document.querySelectorAll(`.${element}`).forEach(element => {
        if(element != currentElement) {
          element.classList.add("blur-background");
        }
      });
    });
  }

  removeBlur() {
    document.querySelectorAll(".blur-background").forEach(element => {
      element.classList.remove("blur-background")
    });
  }

  registerClick(event) {
    const boundingBox = this.activeObjectValue;
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const isWithinBoundingBox = (
      mouseX >= boundingBox.left &&
      mouseX <= boundingBox.right &&
      mouseY >= boundingBox.top &&
      mouseY <= boundingBox.bottom
    );
    console.log(isWithinBoundingBox)
  }
}