import React, { Component, PropTypes } from 'react';
import warn from 'warning';
import shallowEqual from './shallow-equal';
import getFillSize from './get-fillsize';
import { getStyle, css, uniqId } from './dom-utils';

class ScaleText extends Component {
  constructor(props) {
    super(props);
    this.state = {
      size: null
    };

    this._resizing = false;
    this._invalidChild = false;
    this._mounted = false;

    this._handleResize = () => {
      if (!this._resizing) {
        requestAnimationFrame(this.handleResize.bind(this));
      }
      this._resizing = true;
    };
  }

  componentDidMount() {
    const { children } = this.props;
    this._mounted = true;
    this._invalidChild = React.Children.count(children) > 1;

    warn(!this._invalidChild,
      `'ScaleText' expects a single node as a child, but we found
      ${React.Children.count(children)} children instead.
      No scaling will be done on this subtree`
    );

    if (this.shouldResize()) {
      this.resize();
      window.addEventListener('resize', this._handleResize);
    }
  }

  componentDidUpdate(prevProps) {
    // compare children's props for change
    if (!shallowEqual(prevProps.children.props, this.props.children.props)) {
      this.resize();
    }
  }

  componentWillUnmount() {
    if (!this.shouldResize()) {
      window.removeEventListener('resize', this._handleResize);
    }
  }

  shouldResize() {
    return !this._invalidChild;
  }

  handleResize() {
    this._resizing = false;
    this.resize();
  }

  resize() {
    const { minFontSize, maxFontSize } = this.props;
    if (!this._mounted || !this._wrapper) return;
    if (this.ruler) {
      this.clearRuler();
    }
    this.createRuler();
    this.setState({
      size: getFillSize(this.ruler, minFontSize, maxFontSize),
      complete: true
    });
  }

  createRuler() {
    // Create copy of wrapper for sizing
    this.ruler = this._wrapper.cloneNode(true);
    this.ruler.id = uniqId();
    css(this.ruler, {
      position: 'absolute',
      top: '0px',
      left: 'calc(100vw * 2)',
      width: getStyle(this._wrapper, 'width'),
      height: getStyle(this._wrapper, 'height')
    });
    document.body.appendChild(this.ruler);
  }

  clearRuler() {
    document.body.removeChild(this.ruler);
  }

  render() {
    const { size: fontSize } = this.state;
    const { children } = this.props;

    const child = React.isValidElement(children) ?
      React.Children.only(children) :
      (<span>{children}</span>);

    const style = {
      fontSize: fontSize ? `${fontSize.toFixed(2)}px` : 'inherit',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    };

    const childProps = {
      fontSize: fontSize ?
        parseFloat(fontSize.toFixed(2)) :
        'inherit'
    };

    return (
      <div
        className="scaletext-wrapper"
        ref={(c) => { this._wrapper = c; }}
        style={style}
      >
        {
            React.cloneElement(child, childProps)
        }
      </div>
    );
  }
}

ScaleText.propTypes = {
  children: PropTypes.node.isRequired,
  minFontSize: PropTypes.number,
  maxFontSize: PropTypes.number
};

ScaleText.defaultProps = {
  minFontSize: Number.NEGATIVE_INFINITY,
  maxFontSize: Number.POSITIVE_INFINITY
};


// export default ScaleText;
module.exports = ScaleText;
