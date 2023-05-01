function checkParams() {
  const params = new URLSearchParams(window.location.search);

  let bargap = 0;

  if (params.has('hidden')) {
    const hiddenValues = params.get('hidden').split(',');
    hiddenValues.forEach(value => {
      const elements = document.querySelectorAll(`.${value}`);
      elements.forEach(element => {
        element.style.display = 'none';
      });
    });
  }

  if (params.has('leaderboard')) {
    const leaderboards = params.get('leaderboard').split(',');
    leaderboards.forEach(value => {
      const elements = document.querySelectorAll(`.${value}`);
      elements.forEach(element => {
        element.style.display = 'flex';
      });
    });
  }

  if (params.has('barcolor')) {
    const barColorValue = params.get('barcolor');
    document.documentElement.style.setProperty("--clr-bar", "#" + barColorValue);
  }

  if (params.has('missescolor')) {
    const barColorValue = params.get('missescolor');
    document.documentElement.style.setProperty("--clr-misses", "#" + barColorValue);
  }

  if (params.has('barcalculation')) {
    const barCalculationValue = parseFloat(params.get('barcalculation'));
    barmultiplier = barCalculationValue;
  }

  if (params.has('bargap')) {
    const gapValue = parseInt(params.get('bargap'));
    if (!isNaN(gapValue)) {
      bargap = Math.abs(gapValue);
    }
  }

  if (params.has('textgap')) {
    const gapValue = parseInt(params.get('textgap'));
    if (!isNaN(gapValue)) {
      textgap = Math.abs(gapValue);
    }
  }

  if (params.has('textcolor')) {
    const textColorValue = params.get('textcolor');
    document.documentElement.style.setProperty("--clr-fg", "#" + textColorValue);
  }

  if (params.has('order')) {
    const orderValue = params.get('order');
    if (orderValue === "joined") {
      orderAlphabet = false;
    }
  }

  if (params.has('highlight')) {
    const highlightValue = params.get('highlight');
    if (highlightValue === "false" || highlightValue === false) {
      highlight = false;
    }
  }

  if (params.has('highlightscale')) {
    const highlightScaleValue = parseFloat(params.get('highlightscale'));
    if (!isNaN(highlightScaleValue)) {
      highlightScale = highlightScaleValue;
    }
  }

  const style = document.createElement("style");
  style.innerHTML = `
      .bar {
        grid-template-columns: 1fr ${bargap}px 1fr;
      }
      
      .container {
        gap: ${textgap}px;
        margin-left: var(--cs-margin-left);
        margin-right: var(--cs-margin-right);
        transition: margin 200ms;
      }

      .top {
        font-size: ${highlight ? highlightScale : 1}em;
      }
    `;
  document.head.appendChild(style);
}