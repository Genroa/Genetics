

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
		this.angle = data.angle;
		this.neededNeurons = 3;
		this.type = INPUT_LIMB;
		this.linkedNeurons = {};
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
	}
}


RGBSensor = class RGBSensor extends Sensor {
	
}


Motor = class Motor extends Limb {
	constructor(data) {
		super(data);
		this.type = OUTPUT_LIMB;
		this.neededNeurons = 1;
	}
}


/*
DNA est juste le stockage au format JSON de l'objet Being
*/
Being = class Being {
	constructor(DNA) {
		var DNAObject = DNA;

		if(DNA instanceof String) {
			DNAObject = JSON.parse(DNA);
		}

		if(!DNAObject || !DNAObject.sensors || !DNAObject.motors || !DNAObject.neuralSystem) {
			throw new SyntaxError("Invalid DNA :"+JSON.stringify(DNAObject));
		}

		// Limbs loading
		this.sensors = [];
		var sensorsArray = DNAObject.sensors;
		for(sensor of sensorsArray) {
			this.sensors.push(new Limb(limb));
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

computeNeededNeuronsForLimbs(

buildRandomBeing = function() {
	DNAObject = {};
	DNAObject.sensors = [];
	DNAObject.motors = [];
	
	let sensors = buildRandomSensors(3);
	let motors = buildRandomMotors(3);
	
	let inputNeuronsNumber = sensors.length * 3;
	
	DNAObject.neuralSystem = buildRandomNeuralSystem(inputNeuronsNumber);
	
	
	return new Being(DNAObject);
}



console.log("Initialized being values");