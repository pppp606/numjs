"use strict";

const cwise = require("cwise");
const ops = require("ndarray-ops");
const ndFFT = require("ndarray-fft");

import ndarray from "ndarray";

import CONF from "./config";
import DTYPES from "./dtypes";
import NdArray, { ArbDimNumArray } from "./ndarray";
import _ from "./utils";
import * as errors from "./errors";

function broadcast(shape1: number[], shape2: number[]) {
  if (shape1.length === 0 || shape2.length === 0) {
    return;
  }
  const reversed1 = shape1.slice().reverse();
  const reversed2 = shape2.slice().reverse();
  const maxLength = Math.max(shape1.length, shape2.length);
  const outShape = new Array(maxLength);
  for (let i = 0; i < maxLength; i++) {
    if (!reversed1[i] || reversed1[i] === 1) {
      outShape[i] = reversed2[i];
    } else if (!reversed2[i] || reversed2[i] === 1) {
      outShape[i] = reversed1[i];
    } else if (reversed1[i] === reversed2[i]) {
      outShape[i] = reversed1[i];
    } else {
      return;
    }
  }
  return outShape.reverse();
}

/**
 * Add arguments, element-wise.
 *
 * @param {(NdArray|ArbDimNumArray|number)} a
 * @param {(NdArray|ArbDimNumArray|number)} b
 * @returns {NdArray}
 */
function add(
  a: NdArray | ArbDimNumArray | number,
  b: NdArray | ArbDimNumArray | number
) {
  return NdArray.new(a).add(b);
}

/**
 * Multiply arguments, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray)} a
 * @param {(ArbDimNumArray|NdArray|number)} b
 * @returns {NdArray}
 */
function multiply(
  a: ArbDimNumArray | NdArray,
  b: ArbDimNumArray | NdArray | number
) {
  return NdArray.new(a).multiply(b);
}

/**
 * Divide `a` by `b`, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray)} a
 * @param {(ArbDimNumArray|NdArray|number)} b
 * @returns {NdArray}
 */
function divide(
  a: ArbDimNumArray | NdArray,
  b: ArbDimNumArray | NdArray | number
) {
  return NdArray.new(a).divide(b);
}

/**
 * Subtract second argument from the first, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray|number)} a
 * @param {(ArbDimNumArray|NdArray|number)} b
 * @returns {NdArray}
 */
function subtract(
  a: ArbDimNumArray | NdArray | number,
  b: ArbDimNumArray | NdArray | number
) {
  return NdArray.new(a).subtract(b);
}

/**
 * Return true if two arrays have the same shape and elements, false otherwise.
 * @param {(ArbDimNumArray|NdArray)} array1
 * @param {(ArbDimNumArray|NdArray)} array2
 * @returns {boolean}
 */
function equal(
  array1: ArbDimNumArray | NdArray,
  array2: ArbDimNumArray | NdArray
): boolean {
  return NdArray.new(array1).equal(array2);
}

/**
 * Return a copy of the array collapsed into one dimension using row-major order (C-style)

 * @param {(ArbDimNumArray|NdArray)} array
 * @returns {NdArray}
 */
function flatten(array: ArbDimNumArray | NdArray) {
  return NdArray.new(array).flatten();
}

/**
 * Gives a new shape to an array without changing its data.
 * @param {(ArbDimNumArray|NdArray)} array
 * @param {Array|number} shape - The new shape should be compatible with the original shape. If an integer, then the result will be a 1-D array of that length
 * @returns {NdArray}
 */
export function reshape(
  array: ArbDimNumArray | NdArray,
  shape: number[] | number
) {
  // TypeScript is not smart enought on parameters detection on overloading
  // workaround way
  if (typeof shape == "number") {
    return NdArray.new(array).reshape(shape);
  } else {
    return NdArray.new(array).reshape(shape);
  }
}

/**
 * Calculate the exponential of all elements in the input array, element-wise.
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function exp(x: ArbDimNumArray | NdArray | number) {
  return NdArray.new(x).exp();
}

/**
 * Calculate the natural logarithm of all elements in the input array, element-wise.
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function log(x: ArbDimNumArray | NdArray | number) {
  return NdArray.new(x).log();
}

/**
 * Calculate the positive square-root of all elements in the input array, element-wise.
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function sqrt(x: ArbDimNumArray | NdArray | number) {
  return NdArray.new(x).sqrt();
}

/**
 * Raise first array elements to powers from second array, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x1
 * @param {(ArbDimNumArray|NdArray|number)} x2
 * @returns {NdArray}
 */
function power(
  x1: ArbDimNumArray | NdArray | number,
  x2: ArbDimNumArray | NdArray | number
) {
  return NdArray.new(x1).pow(x2);
}

/**
 * Return the sum of input array elements.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {number}
 */
function sum(x: ArbDimNumArray | NdArray | number) {
  return NdArray.new(x).sum();
}

/**
 * Return the arithmetic mean of input array elements.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {number}
 */
function mean(x: ArbDimNumArray | NdArray | number) {
  return NdArray.new(x).mean();
}

/**
 * Returns the standard deviation, a measure of the spread of a distribution, of the input array elements.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {number}
 */
function std(
  x: ArbDimNumArray | NdArray | number,
  options?: { ddof?: number }
) {
  return NdArray.new(x).std(options);
}

/**
 * Return the minimum value of the array
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {Number}
 */
function min(x: ArbDimNumArray | NdArray | number): number {
  return NdArray.new(x).min();
}

/**
 * Return the maximum value of the array
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {Number}
 */
function max(x: ArbDimNumArray | NdArray | number): number {
  return NdArray.new(x).max();
}

/**
 * Return element-wise remainder of division.
 * Computes the remainder complementary to the `floor` function. It is equivalent to the Javascript modulus operator``x1 % x2`` and has the same sign as the divisor x2.
 *
 * @param {(NdArray|ArbDimNumArray|number)} x1
 * @param {(NdArray|ArbDimNumArray|number)} x2
 * @returns {NdArray}
 */
function mod(
  x1: NdArray | ArbDimNumArray | number,
  x2: NdArray | ArbDimNumArray | number
) {
  return NdArray.new(x1).mod(x2);
}

/**
 * Permute the dimensions of the input array according to the given axes.
 *
 * @param {(Array|NdArray|number)} x
 * @param {(number|...number)} [axes]
 * @returns {NdArray}
 * @example
 *
 arr = nj.arange(6).reshape(1,2,3)
 // array([[[ 0, 1, 2],
 //         [ 3, 4, 5]]])
 arr.T
 // array([[[ 0],
 //         [ 3]],
 //        [[ 1],
 //         [ 4]],
 //        [[ 2],
 //         [ 5]]])

 arr.transpose(1,0,2)
 // array([[[ 0, 1, 2]],
 //        [[ 3, 4, 5]]])

 */

function transpose(x: NdArray | ArbDimNumArray | number, axes?: number[]) {
  return NdArray.new(x).transpose(axes);
}

/**
 * Return the inverse of the input array, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function negative(x: ArbDimNumArray | NdArray | number) {
  return NdArray.new(x).negative();
}

/**
 * Return evenly spaced values within a given interval.
 *
 * @param {int} [start=0] - Start of interval. The interval includes this value.
 * @param {int} stop - End of interval. The interval does not include this value.
 * @param {int} [step=1] - Spacing between values. The default step size is 1. If step is specified, start must also be given.
 * @param {(String|Function)} [dtype=Array] The type of the output array. Either string (e.g. 'uint8') or a Constructor function (e.g. Uint8Array).
 *
 * @return {NdArray} Array of evenly spaced values.
 */
function arange(stop: number): NdArray;
function arange(start: number, stop: number): NdArray;
function arange(stop: number, dtype: string | Function): NdArray;
function arange(start: number, stop: number, step: number): NdArray;
function arange(start: number, stop: number, dtype: string | Function): NdArray;
function arange(
  start: number,
  stop: number,
  step: number,
  dtype: string | Function
): NdArray;
function arange(...args: any[]): NdArray {
  if (arguments.length === 1) {
    return arange(0, arguments[0], 1, undefined);
  } else if (arguments.length === 2 && _.isNumber(arguments[1])) {
    return arange(arguments[0], arguments[1], 1, undefined);
  } else if (arguments.length === 2) {
    return arange(0, arguments[0], 1, arguments[1] as string | Function);
  } else if (arguments.length === 3 && !_.isNumber(arguments[2])) {
    return arange(
      arguments[0],
      arguments[1],
      1,
      arguments[2] as string | Function
    );
  }

  let start: number = arguments[0];
  const stop: number = arguments[1];
  const step: number = arguments[2];
  const dtype: string | Function = arguments[3];

  const result = [];
  let i = 0;
  while (start < stop) {
    result[i++] = start;
    start += step;
  }
  return NdArray.new(result, dtype);
}

/**
 * Return a new array of given shape and type, filled with zeros.
 *
 * @param {(Array|int)} shape - Shape of the new array, e.g., [2, 3] or 2.
 * @param {(String|Function)}  [dtype=Array]  The type of the output array. E.g., 'uint8' or Uint8Array.
 *
 * @return {NdArray} Array of zeros with the given shape and dtype
 */
function zeros(shape: number | number[], dtype?: string | Function) {
  if (_.isNumber(shape) && shape >= 0) {
    shape = [shape as number];
  }
  const s = _.shapeSize(shape);
  const T = _.getType(dtype);
  const arr = new NdArray(new T(s), shape as number[]);
  if (arr.dtype === "array") {
    ops.assigns(arr.selection, 0);
  }
  return arr;
}

/**
 * Return a new array of given shape and type, filled with ones.
 *
 * @param {(Array|int)} shape - Shape of the new array, e.g., [2, 3] or 2.
 * @param {(String|Function)}  [dtype=Array] - The type of the output array. E.g., 'uint8' or Uint8Array.
 *
 * @return {NdArray} Array of ones with the given shape and dtype
 */
function ones(shape: number[] | number, dtype?: string | Function) {
  if (_.isNumber(shape) && shape >= 0) {
    shape = [shape as number];
  }
  const s = _.shapeSize(shape);
  const T = _.getType(dtype);
  const arr = new NdArray(new T(s), shape as number[]);
  ops.assigns(arr.selection, 1);
  return arr;
}

/**
 * Return a new array of given shape and type, filled with `undefined` values.
 *
 * @param {(Array|int)} shape - Shape of the new array, e.g., [2, 3] or 2.
 * @param {(String|Function)}  [dtype=Array] - The type of the output array. E.g., 'uint8' or Uint8Array.
 *
 * @return {NdArray} Array of `undefined` values with the given shape and dtype
 */
function empty(shape: number[] | number, dtype?: string | Function) {
  if (_.isNumber(shape) && shape >= 0) {
    shape = [shape as number];
  }
  const s = _.shapeSize(shape);
  const T = _.getType(dtype);
  return new NdArray(new T(s), shape as number[]);
}

/**
 * Create an array of the given shape and propagate it with random samples from a uniform distribution over [0, 1].
 * @param {number|Array|...number} shape - The dimensions of the returned array, should all be positive integers
 * @returns {NdArray}
 */
function random(...shape: number[]): NdArray;
function random(shape?: number | number[]): NdArray;
function random(...args: any[]): NdArray {
  let shape;
  if (arguments.length === 0) {
    return NdArray.new(Math.random());
  } else if (arguments.length === 1) {
    shape = _.isNumber(args[0]) ? [(args[0] as number) | 0] : args[0];
  } else {
    shape = [].slice.call(arguments);
  }
  const s = _.shapeSize(shape);
  const arr = new NdArray(new Float64Array(s), shape);
  ops.random(arr.selection);
  return arr;
}

/**
 * Return the softmax, or normalized exponential, of the input array, element-wise.
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function softmax(x: ArbDimNumArray | NdArray | number) {
  const e = NdArray.new(x).exp();
  const se = e.sum(); // scalar
  ops.divseq(e.selection, se);
  return e;
}

/* istanbul ignore next */
const doSigmoid = cwise({
  args: ["array", "scalar"],
  body: function sigmoidCwise(a, t) {
    a = a < -30 ? 0 : a > 30 ? 1 : 1 / (1 + Math.exp(-1 * t * a));
  },
});

/**
 * Return the sigmoid of the input array, element-wise.
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @param {number} [t=1] - stifness parameter
 * @returns {NdArray}
 */
function sigmoid(x: ArbDimNumArray | NdArray | number, t?: number): NdArray {
  x = NdArray.new(x).clone();
  t = t || 1;
  doSigmoid(x.selection, t);
  return x;
}

/* istanbul ignore next */
const doClip = cwise({
  args: ["array", "scalar", "scalar"],
  body: function clipCwise(a, min, max) {
    a = Math.min(Math.max(min, a), max);
  },
});

/**
 * Clip (limit) the values in an array between min and max, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @param {number} [min=0]
 * @param {number} [max=1]
 * @returns {NdArray}
 */
function clip(
  x: ArbDimNumArray | NdArray | number,
  min?: number,
  max?: number
) {
  if (arguments.length === 1) {
    min = 0;
    max = 1;
  } else if (arguments.length === 2) {
    max = 1;
  }
  const s = x instanceof NdArray ? x.clone() : NdArray.new(x);
  doClip(s.selection, min, max);
  return s;
}

const doLeakyRelu = cwise({
  args: ["array", "scalar"],
  body: function leakyReluCwise(xi, alpha) {
    xi = Math.max(alpha * xi, xi);
  },
});

function leakyRelu(x: NdArray | ArbDimNumArray | number, alpha?: number) {
  alpha = alpha || 1e-3;
  const s = x instanceof NdArray ? x.clone() : NdArray.new(x);
  doLeakyRelu(s.selection, alpha);
  return s;
}

/* istanbul ignore next */
const doTanh = cwise({
  args: ["array"],
  body: function tanhCwise(xi) {
    xi = (Math.exp(2 * xi) - 1) / (Math.exp(2 * xi) + 1);
  },
});

/**
 * Return hyperbolic tangent of the input array, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function tanh(x: ArbDimNumArray | NdArray | number) {
  const s = x instanceof NdArray ? x.clone() : NdArray.new(x);
  doTanh(s.selection);
  return s;
}

/**
 * Return absolute value of the input array, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function abs(x: ArbDimNumArray | NdArray | number) {
  const s = x instanceof NdArray ? x.clone() : NdArray.new(x);
  ops.abseq(s.selection);
  return s;
}

/**
 * Return trigonometric cosine of the input array, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function cos(x: ArbDimNumArray | NdArray | number) {
  const s = x instanceof NdArray ? x.clone() : NdArray.new(x);
  ops.coseq(s.selection);
  return s;
}

/**
 * Return trigonometric inverse cosine of the input array, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function arccos(x: ArbDimNumArray | NdArray | number) {
  const s = x instanceof NdArray ? x.clone() : NdArray.new(x);
  ops.acoseq(s.selection);
  return s;
}

/**
 * Return trigonometric sine of the input array, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function sin(x: ArbDimNumArray | NdArray | number) {
  const s = x instanceof NdArray ? x.clone() : NdArray.new(x);
  ops.sineq(s.selection);
  return s;
}

/**
 * Return trigonometric inverse sine of the input array, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function arcsin(x: ArbDimNumArray | NdArray | number) {
  const s = x instanceof NdArray ? x.clone() : NdArray.new(x);
  ops.asineq(s.selection);
  return s;
}

/**
 * Return trigonometric tangent of the input array, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function tan(x: ArbDimNumArray | NdArray | number) {
  const s = x instanceof NdArray ? x.clone() : NdArray.new(x);
  ops.taneq(s.selection);
  return s;
}

/**
 * Return trigonometric inverse tangent of the input array, element-wise.
 *
 * @param {(ArbDimNumArray|NdArray|number)} x
 * @returns {NdArray}
 */
function arctan(x: ArbDimNumArray | NdArray | number) {
  const s = x instanceof NdArray ? x.clone() : NdArray.new(x);
  ops.ataneq(s.selection);
  return s;
}

/**
 * Dot product of two arrays.
 *
 * WARNING: supported products are:
 *  - matrix dot matrix
 *  - vector dot vector
 *  - matrix dot vector
 *  - vector dot matrix
 * @param {(ArbDimNumArray|NdArray)} a
 * @param {(ArbDimNumArray|NdArray)} b
 * @returns {NdArray}
 */
function dot(
  a: ArbDimNumArray | NdArray,
  b: ArbDimNumArray | NdArray
): NdArray {
  return NdArray.new(a).dot(b);
}

/**
 * Join given arrays along the last axis.
 *
 * @param {Array<number|ArbDimNumArray|NdArray>|...(number|ArbDimNumArray|NdArray)} arrays
 * @returns {NdArray}
 */
function concatenate(...arrays: Array<number | ArbDimNumArray | NdArray>);
function concatenate(arrays: Array<number | ArbDimNumArray | NdArray>);
function concatenate(...args: any[]) {
  let arrays;
  if (args.length > 1) {
    arrays = [].slice.call(args);
  } else {
    arrays = args[0];
  }
  let i, a;
  for (i = 0; i < arrays.length; i++) {
    a = arrays[i];
    arrays[i] = a instanceof NdArray ? a.tolist() : _.isNumber(a) ? [a] : a;
  }
  let m = arrays[0];
  for (i = 1; i < arrays.length; i++) {
    a = arrays[i];
    const mShape = _.getShape(m);
    const aShape = _.getShape(a);
    if (mShape.length !== aShape.length) {
      throw new errors.ValueError(
        "all the input arrays must have same number of dimensions"
      );
    } else if (mShape.length === 1 && aShape.length === 1) {
      m = m.concat(a);
    } else if (
      (mShape.length === 2 && aShape.length === 2 && mShape[0] === aShape[0]) ||
      (mShape.length === 1 && aShape.length === 2 && mShape[0] === aShape[0]) ||
      (mShape.length === 2 && aShape.length === 1 && mShape[0] === aShape[0])
    ) {
      for (let row = 0; row < mShape[0]; row++) {
        m[row] = m[row].concat(a[row]);
      }
    } else if (
      (mShape.length === 3 &&
        aShape.length === 3 &&
        mShape[0] === aShape[0] &&
        mShape[1] === aShape[1]) ||
      (mShape.length === 2 &&
        aShape.length === 3 &&
        mShape[0] === aShape[0] &&
        mShape[1] === aShape[1]) ||
      (mShape.length === 3 &&
        aShape.length === 2 &&
        mShape[0] === aShape[0] &&
        mShape[1] === aShape[1])
    ) {
      for (let rowI = 0; rowI < mShape[0]; rowI++) {
        const rowV = new Array(mShape[1]);
        for (let colI = 0; colI < mShape[1]; colI++) {
          rowV[colI] = m[rowI][colI].concat(a[rowI][colI]);
        }
        m[rowI] = rowV;
      }
    } else {
      throw new errors.ValueError(
        'cannot concatenate  "' + mShape + '" with "' + aShape + '"'
      );
    }
  }
  return NdArray.new(m, arrays[0].dtype);
}

/**
 * Round an array to the to the nearest integer.
 *
 * @param {(ArbDimNumArray|NdArray)} x
 * @returns {NdArray}
 */
function round(x: ArbDimNumArray | NdArray) {
  return NdArray.new(x).round();
}

/**
 * Convolve 2 N-dimensionnal arrays
 *
 * @note: Arrays must have the same dimensions and a must be greater than b.
 * @note: The convolution product is only given for points where the signals overlap completely. Values outside the signal boundary have no effect. This behaviour is known as the 'valid' mode.
 *
 * @param {ArbDimNumArray|NdArray} a
 * @param {ArbDimNumArray|NdArray} b
 */
function convolve(a: ArbDimNumArray | NdArray, b: ArbDimNumArray | NdArray) {
  return NdArray.new(a).convolve(b);
}

/**
 * Convolve 2 N-dimensionnal arrays using Fast Fourier Transform (FFT)
 *
 * @note: Arrays must have the same dimensions and a must be greater than b.
 * @note: The convolution product is only given for points where the signals overlap completely. Values outside the signal boundary have no effect. This behaviour is known as the 'valid' mode.
 *
 * @param {ArbDimNumArray|NdArray} a
 * @param {ArbDimNumArray|NdArray} b
 */
function fftconvolve(a: ArbDimNumArray | NdArray, b: ArbDimNumArray | NdArray) {
  return NdArray.new(a).fftconvolve(b);
}

function fft(x: ArbDimNumArray | NdArray): NdArray {
  x = x instanceof NdArray ? x.clone() : NdArray.new(x);
  const xShape = x.shape;
  const d = xShape.length;
  if (xShape[d - 1] !== 2) {
    throw new errors.ValueError(
      "expect last dimension of the array to have 2 values (for both real and imaginary part)"
    );
  }
  let rPicker = new Array(d);
  let iPicker = new Array(d);
  rPicker[d - 1] = 0;
  iPicker[d - 1] = 1;
  ndFFT(
    1,
    x.selection.pick.apply(x.selection, rPicker),
    x.selection.pick.apply(x.selection, iPicker)
  );
  return x;
}

function ifft(x: ArbDimNumArray | NdArray): NdArray {
  x = x instanceof NdArray ? x.clone() : NdArray.new(x);
  const xShape = x.shape;
  const d = xShape.length;
  if (xShape[d - 1] !== 2) {
    throw new errors.ValueError(
      "expect last dimension of the array to have 2 values (for both real and imaginary part)"
    );
  }
  let rPicker = new Array(d);
  let iPicker = new Array(d);
  rPicker[d - 1] = 0;
  iPicker[d - 1] = 1;
  ndFFT(
    -1,
    x.selection.pick.apply(x.selection, rPicker),
    x.selection.pick.apply(x.selection, iPicker)
  );
  return x;
}

/**
 * Extract a diagonal or construct a diagonal array.
 *
 * @param {ArbDimNumArray|NdArray} x
 * @returns {NdArray} a view a of the original array when possible, a new array otherwise
 */
function diag(x: ArbDimNumArray | NdArray) {
  return NdArray.new(x).diag();
}

/**
 * The identity array is a square array with ones on the main diagonal.
 * @param {number} Number of rows (and columns) in n x n output.
 * @param {(String|Function)}  [dtype=Array]  The type of the output array. E.g., 'uint8' or Uint8Array.
 * @return {NdArray} n x n array with its main diagonal set to one, and all other elements 0
 */
function identity(n: number, dtype?: string | Function) {
  const arr = zeros([n, n], dtype);
  for (let i = 0; i < n; i++) arr.set(i, i, 1);
  return arr;
}

/**
 * Join a sequence of arrays along a new axis.
 * The axis parameter specifies the index of the new axis in the dimensions of the result.
 * For example, if axis=0 it will be the first dimension and if axis=-1 it will be the last dimension.
 * @param {Array<NdArray|ArbDimNumArray|number>} sequence of array_like
 * @param {number} [axis=0] The axis in the result array along which the input arrays are stacked.
 * @return {NdArray} The stacked array has one more dimension than the input arrays.
 */
function stack(
  arrays: Array<NdArray | ArbDimNumArray | number>,
  axis?: number
): NdArray {
  axis = axis || 0;
  if (!arrays || arrays.length === 0) {
    throw new errors.ValueError("need at least one array to stack");
  }
  const arrays2 = arrays.map(function (a) {
    return (_.isNumber(a) ? a : NdArray.new(a)) as number | NdArray;
  });
  const expectedShape = (arrays2[0] as NdArray).shape || []; // for numbers

  for (let i = 1; i < arrays2.length; i++) {
    const shape = (arrays2[i] as NdArray).shape || []; // for numbers
    const len = Math.max(expectedShape.length, shape.length);
    for (let j = 0; j < len; j++) {
      if (expectedShape[j] !== shape[j])
        throw new errors.ValueError(
          "all input arrays must have the same shape"
        );
    }
  }
  let stacked;
  if (expectedShape.length === 0) {
    // stacking numbers
    stacked = concatenate(arrays2);
  } else {
    stacked = zeros([arrays2.length].concat(expectedShape));
    for (let i = 0; i < arrays2.length; i++) {
      stacked.pick(i).assign(arrays2[i], false);
    }
  }

  if (axis) {
    // recompute neg axis
    if (axis < 0) axis = stacked.ndim + axis;

    const d = stacked.ndim;
    const axes = new Array(d);
    for (let i = 0; i < d; i++) {
      axes[i] = i < axis ? i + 1 : i === axis ? 0 : i;
    }

    return stacked.transpose(axes);
  }
  return stacked;
}

/**
 * Reverse the order of elements in an array along the given axis.
 * The shape of the array is preserved, but the elements are reordered.
 * New in version 0.15.0.
 * @param {ArbDimNumArray|NdArray} m Input array.
 * @param {number} axis Axis in array, which entries are reversed.
 * @return {NdArray} A view of `m` with the entries of axis reversed.  Since a view is returned, this operation is done in constant time.
 */
function flip(m: ArbDimNumArray | NdArray, axis: number): NdArray {
  m = NdArray.new(m);
  const indexer = ones(m.ndim).tolist();
  let cleanaxis = axis;
  while (cleanaxis < 0) {
    cleanaxis += m.ndim;
  }
  if (indexer[cleanaxis] === undefined) {
    throw new errors.ValueError(
      "axis=" + axis + "invalid for the " + m.ndim + "-dimensional input array"
    );
  }
  indexer[cleanaxis] = -1;
  return m.step.apply(m, indexer);
}

/**
 * Rotate an array by 90 degrees in the plane specified by axes.
 * Rotation direction is from the first towards the second axis.
 * New in version 0.15.0.
 * @param {ArbDimNumArray|NdArray} m array_like
 * @param {number} [k=1] Number of times the array is rotated by 90 degrees.
 * @param {Array|NdArray} [axes2=(0,1)] The array is rotated in the plane defined by the axes. Axes must be different.
 * @return {NdArray} A rotated view of m.
 */
function rot90(
  m: ArbDimNumArray | NdArray,
  k?: number,
  axes?: number[] | NdArray
): NdArray {
  k = k || 1;
  while (k < 0) {
    k += 4;
  }
  k = k % 4;
  m = NdArray.new(m);
  let axes2: any = NdArray.new(axes || [0, 1]);
  if (axes2.shape.length !== 1 || axes2.shape[0] !== 2) {
    throw new errors.ValueError("len(axes) must be 2");
  }
  axes2 = axes2.tolist();
  if (axes2[0] === axes2[1] || abs(axes2[0] - axes2[1]).ndim === m.ndim) {
    throw new errors.ValueError("Axes must be different.");
  }

  if (k === 0) {
    return m;
  }
  if (k === 2) {
    return flip(flip(m, axes2[0]), axes2[1]);
  }
  const axesList = arange(m.ndim).tolist();
  const keep = axesList[axes2[0]];
  axesList[axes2[0]] = axesList[axes2[1]];
  axesList[axes2[1]] = keep;
  if (k === 1) {
    return transpose(flip(m, axes2[1]), axesList as number[]);
  } else {
    return flip(transpose(m, axesList as number[]), axes2[1]);
  }
}

export default {
  config: CONF,
  dtypes: DTYPES,
  NdArray: NdArray,
  ndarray: ndarray,
  array: NdArray.new,
  arange: arange,
  reshape: reshape,
  zeros: zeros,
  ones: ones,
  empty: empty,
  flatten: flatten,
  flip: flip,
  random: random,
  softmax: softmax,
  sigmoid: sigmoid,
  leakyRelu: leakyRelu,
  abs: abs,
  arccos: arccos,
  arcsin: arcsin,
  arctan: arctan,
  cos: cos,
  sin: sin,
  tan: tan,
  tanh: tanh,
  clip: clip,
  exp: exp,
  log: log,
  sqrt: sqrt,
  power: power,
  sum: sum,
  mean: mean,
  std: std,
  dot: dot,
  add: add,
  subtract: subtract,
  multiply: multiply,
  divide: divide,
  negative: negative,
  equal: equal,
  max: max,
  min: min,
  mod: mod,
  remainder: mod,
  concatenate: concatenate,
  transpose: transpose,
  errors: errors,
  broadcast: broadcast,
  round: round,
  convolve: convolve,
  fftconvolve: fftconvolve,
  fft: fft,
  ifft: ifft,
  diag: diag,
  identity: identity,
  stack: stack,
  rot90: rot90,
  int8: function (array) {
    return NdArray.new(array, "int8");
  },
  uint8: function (array: number[] | number) {
    return NdArray.new(array, "uint8");
  },
  int16: function (array: number[] | number) {
    return NdArray.new(array, "int16");
  },
  uint16: function (array: number[] | number) {
    return NdArray.new(array, "uint16");
  },
  int32: function (array: number[] | number) {
    return NdArray.new(array, "int32");
  },
  uint32: function (array: number[] | number) {
    return NdArray.new(array, "uint32");
  },
  float32: function (array: number[] | number) {
    return NdArray.new(array, "float32");
  },
  float64: function (array: number[] | number) {
    return NdArray.new(array, "float64");
  },
};

// export default kk;