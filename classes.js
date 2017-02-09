

Neuron = class Neuron extends synaptic.Neuron {
	constructor() {
		super();
		this.tick = -1;
	}
	
	activateNetwork(newTick) {
		if(this.tick != newTick) {
			//console.log("ID "+this.ID+" ticked!");
			this.activate();
			this.tick = newTick;
			var neighboors = this.neighboors;
			
			Object.keys(neighboors).forEach(function(neuronId) {
				var neuron = neighboors[neuronId];
				if(neuron && neuron.activateNetwork) {
					neuron.activateNetwork(newTick);
				}
			});
		}
	}
}

/*
var n = new Neuron();
var n2= new Neuron();
n.project(n2);
n2.project(n);
n.activateNetwork(1);
*/

NeuralSystem = class NeuralSystem {
	constructor(DNA) {
		var DNAObject = DNA;

		if(DNA instanceof String) {
			DNAObject = JSON.parse(DNA);
		}

		if(!DNAObject) {
			DNAObject = {inputs: {}, outputs: {}, neurons: {}};
		}
		if(!DNAObject.inputs) {
			DNAObject.inputs = {};
		}
		if(!DNAObject.outputs) {
			DNAObject.outputs = {};
		}
		if(!DNAObject.neurons) {
			DNAObject.neurons = {};
		}

		this.inputs  = DNAObject.inputs;
		this.outputs = DNAObject.outputs;
		this.neurons = DNAObject.neurons;
	}
}

const INPUT_LIMB = 0;
const OUTPUT_LIMB = 1;


Limb = class Limb {
	constructor(data) {
		if(data) {
			this.angle = data.angle;
		}
		this.neededNeurons = 3;
		this.type = INPUT_LIMB;
		this.class = "Limb";
		this.linkedNeurons = [];
	}
	
	setLinkedNeurons(neurons) {
		this.linkedNeurons = neurons;
	}
	
	draw(/*will need a lot of parameters here*/) {}
	update() {}
}



Sensor = class Sensor extends Limb {
	constructor(data) {
		super(data);
		// No need to specify the type : it is INPUT_LIMB by default
		this.class = "Sensor";
	}
}


RGBSensor = class RGBSensor extends Sensor {
	constructor(data) {
		super(data);
		// No need to specify the type : it is INPUT_LIMB by default
		this.class = "RGBSensor";
	}
}


Motor = class Motor extends Limb {
	constructor(data) {
		super(data);
		this.type = OUTPUT_LIMB;
		this.neededNeurons = 1;
		this.class = "Motor";
	}
}



Being = class Being {
	constructor(DNA) {
		var DNAObject = DNA;

		console.log(DNAObject);

		if(DNA instanceof String) {
			DNAObject = JSON.parse(DNA);
			/*
			Also rebuild objects from it
			*/
		}

		if(!DNAObject || !DNAObject.sensors || !DNAObject.motors || !DNAObject.neuralSystem) {
			throw new SyntaxError("Invalid DNA : "+JSON.stringify(DNAObject));
		}

		// Limbs loading
		this.sensors = [];
		var sensorsArray = DNAObject.sensors;
		for(let sensor of sensorsArray) {
			this.sensors.push(sensor);
		}

		this.motors = [];
		var motorsArray = DNAObject.motors;
		for(let motor of motorsArray) {
			this.motors.push(motor);
		}

		// Neural System loading
		this.neuralSystem = new NeuralSystem(DNAObject.neuralSystem);
		this.energy = 1000;
		this.pain = 0;
	}

	computeDNA() {
		return JSON.stringify(this);
	}

	update() {
		/* 
		Boucler sur les prop d'un objet:
		Object.keys(obj).forEach(function(prop){});
		 */
		for(limb of this.limbs) {
			limb.update();
		}
	}

	draw() {
		for(limb of this.limbs) {
			limb.draw();
		}
	}
}


buildRandomNeuralSystem = function(inputNumber, outputNumber) {
	var DNAObject = {inputs: {}, outputs: {}, neurons: {}};
	
	// Produce neurons and link them (randomly?)
	for(let i=0; i<inputNumber; i++) {
		let neuron = new Neuron();
		DNAObject.inputs[neuron.ID] = neuron;
	}
	
	for(let i=0; i<outputNumber; i++) {
		let neuron = new Neuron();
		DNAObject.outputs[neuron.ID] = neuron;
	}
	
	return new NeuralSystem(DNAObject);
}

buildRandomSensors = function(number) {
	sensors = [];
	for(let i=0; i<number; i++) {
		sensors.push(new RGBSensor());
	}
	
	return sensors;
}

buildRandomMotors = function(number) {
	motors = [];
	for(let i=0; i<number; i++) {
		motors.push(new Motor());
	}
	
	return motors;
}

computeNeededNeuronsForLimbs = function(limbs) {
	let count = 0;
	for(let limb of limbs) {
		count += limb.neededNeurons;
	}
	return count;
}

assignNeuronsToLimbs = function(sensors, motors, neuralSystem) {
	let neuronCount = 0;
	let i=0;
	let neurons = Object.values(neuralSystem.inputs);
	for(sensor of sensors) {
		for(let j=0; j<sensor.neededNeurons; j++) {
			sensor.linkedNeurons.push(neurons[i]);
			i++;
		}
	}

	i=0;
	neurons = Object.values(neuralSystem.outputs);
	for(motor of motors) {
		for(let j=0; j<motor.neededNeurons; j++) {
			motor.linkedNeurons.push(neurons[i]);
			i++;
		}
	}
}


buildRandomBeing = function() {
	DNAObject = {};
	DNAObject.sensors = [];
	DNAObject.motors = [];
	
	let sensors = buildRandomSensors(3);
	let motors = buildRandomMotors(3);

	let inputNeuronsNumber = computeNeededNeuronsForLimbs(sensors);
	let outputNeuronsNumber = computeNeededNeuronsForLimbs(motors);
	
	DNAObject.neuralSystem = buildRandomNeuralSystem(inputNeuronsNumber, outputNeuronsNumber);

	assignNeuronsToLimbs(sensors, motors, DNAObject.neuralSystem);

	DNAObject.sensors = sensors;
	DNAObject.motors = motors;
	
	return new Being(DNAObject);
}



console.log("Initialized being values");