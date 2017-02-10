

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

		if(DNA instanceof String) {
			DNAObject = JSON.parse(DNA);
			/*
			Also rebuild objects from it
			*/
		}

		if(!DNAObject 
		|| !DNAObject.sensors 
		|| !DNAObject.motors 
		|| !DNAObject.neuralSystem
		|| !DNAObject.energyNeuron
		|| !DNAObject.damageNeuron
		|| !DNAObject.ageNeuron
		|| !DNAObject.reproductionNeuron) {
			try {
				throw new SyntaxError("Invalid DNA : "+JSON.stringify(DNAObject));
			} catch(e) {
				console.log(DNAObject);
				throw new SyntaxError("Invalid DNA");
			}
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
		this.energyNeuron = DNAObject.energyNeuron;
		
		this.damage = 0;
		this.damageNeuron = DNAObject.damageNeuron;
		
		this.tick = 0;
		this.ageNeuron = DNAObject.ageNeuron;
		
		this.reproductionNeuron = DNAObject.reproductionNeuron;
	}

	computeDNA() {
		return JSON.stringify(this);
	}

	update() {
		/* 
		Boucler sur les prop d'un objet:
		Object.keys(obj).forEach(function(prop){});
		 */
		this.tick+=1;
		
		this.damageNeuron.activation = this.damage;
		this.energyNeuron.activation = this.energy;
		
		let being = this;
		
		Object.values(this.neuralSystem.inputs).forEach(function(neuron){
			neuron.activateNetwork(being.tick);
		});
	}

	draw() {
		
	}
	
	displayOutputValues() {
		let values = [];
		Object.values(this.neuralSystem.outputs).forEach(function(neuron) {
			values.push(neuron.activation);
		});
		console.log(values);
	}
	
	displayInputValues() {
		let values = [];
		Object.values(this.neuralSystem.inputs).forEach(function(neuron) {
			values.push(neuron.activation);
		});
		console.log(values);
	}
}


buildRandomNeuralSystem = function(inputNumber, outputNumber) {
	var DNAObject = {inputs: {}, outputs: {}, neurons: {}};
	
	// Produce input neurons
	for(let i=0; i<inputNumber; i++) {
		let neuron = new Neuron();
		DNAObject.inputs[neuron.ID] = neuron;
	}
	
	// produce output neurons
	for(let i=0; i<outputNumber; i++) {
		let neuron = new Neuron();
		DNAObject.outputs[neuron.ID] = neuron;
	}
	
	// produce central neural system neurons
	let systemSize = 40;
	let numberOfConnections = systemSize * 5;
	for(let i=0; i<systemSize; i++) {
		let neuron = new Neuron();
		DNAObject.neurons[neuron.ID] = neuron;
	}
	
	// "randomly" link neurons
	// internal connections
	for(let i=0; i<numberOfConnections; i++) {
		let from = Object.values(DNAObject.neurons)[ Math.floor(Math.random()*systemSize) ];
		let to = Object.values(DNAObject.neurons)[ Math.floor(Math.random()*systemSize) ];
		from.project(to);
	}
	
	for(let i=0; i<inputNumber*5; i++) {
		let from = Object.values(DNAObject.inputs)[ Math.floor(Math.random()*inputNumber) ];
		let to = Object.values(DNAObject.neurons)[ Math.floor(Math.random()*systemSize) ];
		from.project(to);
	}
	
	for(let i=0; i<outputNumber*5; i++) {
		let from = Object.values(DNAObject.neurons)[ Math.floor(Math.random()*systemSize) ];
		let to = Object.values(DNAObject.outputs)[ Math.floor(Math.random()*outputNumber) ];
		from.project(to);
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
	
	let sensors = buildRandomSensors( Math.floor(Math.random()*(5-1)+1) );
	let motors = buildRandomMotors( Math.floor(Math.random()*(5-1)+1) );
	
	// +1 for energy info
	// +1 for damage info
	// +1 for age
	let inputNeuronsNumber = computeNeededNeuronsForLimbs(sensors);
	
	// +1 for reproduction decision
	let outputNeuronsNumber = computeNeededNeuronsForLimbs(motors);
	
	DNAObject.neuralSystem = buildRandomNeuralSystem(inputNeuronsNumber+3, outputNeuronsNumber+1);

	assignNeuronsToLimbs(sensors, motors, DNAObject.neuralSystem);
	
	let inputsArray = Object.values(DNAObject.neuralSystem.inputs);
	let outputsArray = Object.values(DNAObject.neuralSystem.outputs);
	
	DNAObject.energyNeuron = inputsArray[inputNeuronsNumber]; //-1 +1
	DNAObject.damageNeuron = inputsArray[inputNeuronsNumber+1];
	DNAObject.ageNeuron = inputsArray[inputNeuronsNumber+2];
	
	DNAObject.reproductionNeuron = outputsArray[outputNeuronsNumber]; //-1 +1
	
	DNAObject.sensors = sensors;
	DNAObject.motors = motors;
	
	return new Being(DNAObject);
}



console.log("Initialized being values");