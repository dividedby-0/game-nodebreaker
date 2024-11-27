/**
 * @typedef {Object} TerminalTextOptions
 * @property {number} [typingSpeed=50] - Typing animation speed in ms
 * @property {number} [randomCharHoldTime=30] - Random character display duration in ms
 * @property {string} [textColor="#00ff00"] - Text color
 * @property {string} [caretColor="#00ff00"] - Caret color
 * @property {string} [randomChars="!@#$%^&*()_+-=[]{}|;:,.<>?/~"] - Characters for random caret effect
 */

class TerminalText {
  /**
   * @param {string} containerId - Container element ID
   * @param {TerminalTextOptions} [options] - Configuration options
   */
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      typingSpeed: options.typingSpeed || 15,
      randomCharHoldTime: options.randomCharHoldTime || 25,
      textColor: options.textColor || "#00ff00",
      caretColor: options.caretColor || "#00ff00",
      randomChars: "!@#$%^&*()_+-=[]{}|;:,.<>?/~",
    };
    this.applyOptions(containerId);
    this.currentText = "";
    this.targetText = "";
    this.currentIndex = 0;
    this.isAnimating = false;
  }

  applyOptions(containerId) {
    switch (containerId) {
      case "score":
        if (this.options.textColor) {
          document.documentElement.style.setProperty(
            "--score-terminal-text-color",
            this.options.textColor
          );
          const terminalTextElements = document.getElementsByClassName(
            "score-terminal-text"
          );
          for (let element of terminalTextElements) {
            element.style.color = this.options.textColor;
          }
        }

        if (this.options.caretColor) {
          document.documentElement.style.setProperty(
            "--score-terminal-caret-color",
            this.options.caretColor
          );
          const terminalCaretElements = document.getElementsByClassName(
            "score-terminal-caret"
          );
          for (let element of terminalCaretElements) {
            element.style.backgroundColor = options.caretColor;
          }
        }
        break;

      case "timer":
        if (this.options.textColor) {
          document.documentElement.style.setProperty(
            "--timer-terminal-text-color",
            this.options.textColor
          );
          const terminalTextElements = document.getElementsByClassName(
            "timer-terminal-text"
          );
          for (let element of terminalTextElements) {
            element.style.color = this.options.textColor;
          }
        }

        if (this.options.caretColor) {
          document.documentElement.style.setProperty(
            "--timer-terminal-caret-color",
            this.options.caretColor
          );
          const terminalCaretElements = document.getElementsByClassName(
            "timer-terminal-caret"
          );
          for (let element of terminalCaretElements) {
            element.style.backgroundColor = options.caretColor;
          }
        }
        break;

      case "breakers":
        if (this.options.textColor) {
          document.documentElement.style.setProperty(
            "--breakers-terminal-text-color",
            this.options.textColor
          );
          const terminalTextElements = document.getElementsByClassName(
            "breakers-terminal-text"
          );
          for (let element of terminalTextElements) {
            element.style.color = this.options.textColor;
          }
        }

        if (this.options.caretColor) {
          document.documentElement.style.setProperty(
            "--breakers-terminal-caret-color",
            this.options.caretColor
          );
          const terminalCaretElements = document.getElementsByClassName(
            "breakers-terminal-caret"
          );
          for (let element of terminalCaretElements) {
            element.style.backgroundColor = options.caretColor;
          }
        }
        break;

      case "message":
        if (this.options.textColor) {
          document.documentElement.style.setProperty(
            "--message-terminal-text-color",
            this.options.textColor
          );
          const terminalTextElements = document.getElementsByClassName(
            "message-terminal-text"
          );
          for (let element of terminalTextElements) {
            element.style.color = this.options.textColor;
          }
        }

        if (this.options.caretColor) {
          document.documentElement.style.setProperty(
            "--message-terminal-caret-color",
            this.options.caretColor
          );
          const terminalCaretElements = document.getElementsByClassName(
            "message-terminal-caret"
          );
          for (let element of terminalCaretElements) {
            element.style.backgroundColor = this.options.caretColor;
          }
        }
        break;

      default:
        break;
    }
  }

  async typeText(text, element) {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.targetText = text;
    this.currentText = "";
    this.currentIndex = 0;
    this.container.innerHTML = "";

    while (this.currentIndex <= this.targetText.length) {
      const textBeforeCaret = this.targetText.substring(0, this.currentIndex);
      //   const currentChar = this.targetText[this.currentIndex] || "";

      // Random character animation in caret
      for (let i = 0; i < 3; i++) {
        const randomChar =
          this.options.randomChars[
            Math.floor(Math.random() * this.options.randomChars.length)
          ];

        switch (element.id) {
          case "score":
            this.container.innerHTML = `
            <span class="score-terminal-text">${textBeforeCaret}<span class="score-terminal-caret">${randomChar}</span>
            </span>`;
            break;
          case "timer":
            this.container.innerHTML = `
            <span class="timer-terminal-text">${textBeforeCaret}<span class="timer-terminal-caret">${randomChar}</span>
            </span>`;
            break;
          case "breakers":
            this.container.innerHTML = `
            <span class="breakers-terminal-text">${textBeforeCaret}<span class="breakers-terminal-caret">${randomChar}</span>
            </span>`;
            break;
          case "message":
            this.container.innerHTML = `
            <span class="message-terminal-text">${textBeforeCaret}<span class="message-terminal-caret">${randomChar}</span>
            </span>`;
            break;

          default:
            break;
        }

        await this.delay(this.options.randomCharHoldTime);
      }

      this.currentIndex++;
      await this.delay(this.options.typingSpeed);
    }
    switch (element.id) {
      case "score":
        this.caret = document.getElementsByClassName("score-terminal-caret");
        this.caret[0].remove();
        break;
      case "timer":
        this.caret = document.getElementsByClassName("timer-terminal-caret");
        this.caret[0].remove();
        break;
      case "breakers":
        this.caret = document.getElementsByClassName("breakers-terminal-caret");
        this.caret[0].remove();
        break;
      case "message":
        this.caret = document.getElementsByClassName("message-terminal-caret");
        this.caret[0].remove();
        break;

      default:
        break;
    }
    this.isAnimating = false;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
