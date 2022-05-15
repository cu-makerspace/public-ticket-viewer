/**
 * @Author: Nick Steele
 * @Date:   12:26 Jun 06 2021
 * @Last modified by:   Nick Steele
 * @Last modified time: 15:36 Jul 31 2021
 */

import React, {Component} from "react";
import PropTypes from 'prop-types';
import './material-icon.css';
import {hot} from "react-hot-loader";

class MaterialIcon extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <span
        className={"material-icons-outlined " + (this.props.className ? this.props.className : '')}
        style={{fontSize: this.props.size_em + "em"}}
        title={this.props.title ? this.props.title : ''}
        >
          {this.props.icon}
        </span>);
  }
}

MaterialIcon.propTypes = {
  icon: PropTypes.string.isRequired,
  size_em: PropTypes.number,
  title: PropTypes.string
};

export default hot(module)(MaterialIcon);
