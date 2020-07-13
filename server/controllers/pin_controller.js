const Pin = require('../models/pin_model');

const createPin = async (pin) => {
  const { error, message } = await Pin.createPin(pin);
  if (error) {
    console.log(error);
  }
};

const updatePin = async (pin) => {
  const { error, message } = await Pin.updatePin(pin);
  if (error) {
    console.log(error);
  }
};

const getPin = async (requirement) => {
  const { error, pins } = await Pin.getPin(requirement);
  if (error) {
    console.log(error);
    return { error };
  }
  return { pins };
};

module.exports = {
  createPin,
  updatePin,
  getPin,
};
