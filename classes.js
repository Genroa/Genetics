

/*********************
CONSTANTS
*********************/
const INPUT_LIMB = 0;
const OUTPUT_LIMB = 1;


/*********************
HELPER FUNCTIONS
*********************/
generateUUID = function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

componentToHex = function(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

rgbToHex = function(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
/*********************
CLASSES DEFINITION
*********************/

World = class World {
	constructor(width, height) {
		//Create the renderer
		this.renderer = PIXI.autoDetectRenderer(width, height);
		this.renderer.backgroundColor = 0x061639;
		
		//Add the canvas to the HTML document
		document.body.appendChild(this.renderer.view);

		//Create a container object called the `stage`
		this.stage = new PIXI.Container();
		
		// Build graphic part
		this.graphics = new PIXI.Graphics();
		this.stage.addChild(this.graphics);
		this.graphicContext = document.getElementsByTagName("canvas")[0].getContext("webgl", {preserveDrawingBuffer: true});


		//Physics
		this.physicsWorld = Physics();
		var physicsWorld = this.physicsWorld;

		var bounds = Physics.aabb(0, 0, width, height);
		this.physicsWorld.add( Physics.behavior('edge-collision-detection', {
			aabb: bounds,
			restitution: 0.3
		}) );
		
		
		//this.physicsWorld.add( Physics.behavior('constant-acceleration'));
		this.physicsWorld.add( Physics.behavior('body-impulse-response') );
		this.physicsWorld.add( Physics.behavior('body-collision-detection') );
		this.physicsWorld.add( Physics.behavior('sweep-prune') );


		Physics.util.ticker.on(function(time) {
			physicsWorld.step(time);
		});
		Physics.util.ticker.start();

		this.stopRunning = false;
		this.beings = [];
	}
	
	addBeing(being) {
		this.beings.push(being);
	}
	
	updateWorld() {
		for(let being of this.beings) {
			being.update(this);
		}
	}
	
	drawWorld() {
		this.graphics.clear();
		this.graphics.lineStyle(1, 0x75048e, 1);

		for(let being of this.beings) {
			being.draw(this);
		}

	}
	
	run() {
		this.drawWorld();
		//Loop this function 60 times per second
		if(!this.stopRunning) {
			requestAnimationFrame(this.run.bind(this));
		}
		this.drawWorld();
			
		//Tell the `renderer` to `render` the `stage`
		this.renderer.render(this.stage);
		this.graphicContext = document.getElementsByTagName("canvas")[0].getContext("webgl", {preserveDrawingBuffer: true});
		
		this.updateWorld();
	
	}

	_run() {

	}
	
	stop() {
		this.stopRunning = true;
	}
}

Neuron = class Neuron extends synaptic.Neuron {
	constructor(NeuronDNA) {
		super();
		
		if(!NeuronDNA) {
			this.localID = generateUUID();
		} else {
			this.localID = NeuronDNA.localID;
		}
		this.tick = -1;
	}
	
	activateNetwork(newTick) {
		if(this.tick != newTick) {
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
	
	computeDNA() {
		let connections = [];
		Object.values(this.connections.projected).forEach(function(connection) {
			connections.push({to: connection.to.localID, weight: connection.weight});
		});
		return {
			connections:connections,
			localID: this.localID
		};
	}
}


NeuralSystem = class NeuralSystem {
	constructor(NeuralSystemDNA) {

		if(!NeuralSystemDNA 
		|| !NeuralSystemDNA.inputs 
		|| !NeuralSystemDNA.outputs 
		|| !NeuralSystemDNA.neurons) {
			throw new SyntaxError("Invalid neural system DNA structure : "+JSON.stringify(DNAObject));
		}
		
		// Create neurons
		let inputs = {};
		let outputs = {};
		let neurons = {};
		
		Object.values(NeuralSystemDNA.inputs).forEach(function(neuronDNA) {
			let neuron = new Neuron(neuronDNA);
			inputs[neuron.localID] = neuron;
		});
		
		Object.values(NeuralSystemDNA.outputs).forEach(function(neuronDNA) {
			let neuron = new Neuron(neuronDNA);
			outputs[neuron.localID] = neuron;
		});
		
		Object.values(NeuralSystemDNA.neurons).forEach(function(neuronDNA) {
			let neuron = new Neuron(neuronDNA);
			neurons[neuron.localID] = neuron;
		});
		
		this.inputs  = inputs;
		this.outputs = outputs;
		this.neurons = neurons;
		
		// Build connections
		Object.values(NeuralSystemDNA.inputs).forEach(function(neuronDNA) {
			for(let connection of neuronDNA.connections) {
				inputs[neuronDNA.localID].project(neurons[connection.to], connection.weight);
			}
		});
		
		Object.values(NeuralSystemDNA.neurons).forEach(function(neuronDNA) {
			for(let connection of neuronDNA.connections) {
				let to = neurons[connection.to];
				if(!to) {
					to = outputs[connection.to];
				}
				neurons[neuronDNA.localID].project(to, connection.weight);
			}
		});
	}
	
	computeDNA() {
		let inputs = {};
		let outputs = {};
		let neurons = {};
		
		Object.values(this.inputs).forEach(function(neuron) {
			inputs[neuron.localID] = neuron.computeDNA();
		});
		
		Object.values(this.outputs).forEach(function(neuron) {
			outputs[neuron.localID] = neuron.computeDNA();
		});
		
		Object.values(this.neurons).forEach(function(neuron) {
			neurons[neuron.localID] = neuron.computeDNA();
		});
		
		return {inputs: inputs, outputs: outputs, neurons: neurons};
	}
}


Limb = class Limb {
	constructor(data) {
		if(data) {
			this.angle = data.angle;
		} else {
			this.angle = 0.0;
		}
		this.neededNeurons = 3;
		this.type = INPUT_LIMB;
		this.class = "Limb";
		this.linkedNeurons = [];
		this.color = 0x000000;
	}
	
	setLinkedNeurons(neurons) {
		this.linkedNeurons = neurons;
	}
	
	draw(graphics, parent) {
		let angle = parent.angle + this.angle;
		let realX = 28*Math.cos(angle);//+0*Math.sin(angle);
		let realY = -28*Math.sin(angle);//+0*Math.cos(angle);

		graphics.beginFill(this.color);
		graphics.drawCircle(parent.x+realX, parent.y+realY, 4);
		graphics.endFill();
	}

	update(world, parent) {}
	
	computeDNA() {
		let linkedNeurons = [];
		
		Object.values(this.linkedNeurons).forEach(function(neuron){
			linkedNeurons.push(neuron.localID);
		});
		
		return {
			class: this.class,
			angle: this.angle,
			linkedNeurons: linkedNeurons
		}
	}
}


Sensor = class Sensor extends Limb {
	constructor(data) {
		super(data);
		// No need to specify the type : it is INPUT_LIMB by default
		this.class = "Sensor";
		this.color = 0xEE42F4;
	}
}


RGBSensor = class RGBSensor extends Sensor {
	constructor(data) {
		super(data);
		// No need to specify the type : it is INPUT_LIMB by default
		this.neededNeurons = 3 * 10;
		this.class = "RGBSensor";
		this._eyeValues = new Uint8Array(4);
	}

	update(world, parent) {
		let angle = parent.angle + this.angle;
		let ctx = world.graphicContext;

		for(let i = 0; i < this.neededNeurons/3; i++) {
			let x = 33 + i*10;
			let realX = parent.x + (x*Math.cos(angle));
			let realY = parent.y + (-x*Math.sin(angle));

			if(realX < 0 || realY < 0 || realX > world.renderer.width || realY > world.renderer.height) {
				this._eyeValues[0] = 0;
				this._eyeValues[1] = 0;
				this._eyeValues[2] = 0;
			}
			else {
				ctx.readPixels(realX, realY, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, this._eyeValues);
			}
			//console.log(this._eyeValues[0]/255 + " "+ this._eyeValues[1]/255 + " "+ this._eyeValues[2]/255);
			this.linkedNeurons[i*3].activation = this._eyeValues[0]/255;
			this.linkedNeurons[i*3+1].activation = this._eyeValues[1]/255;
			this.linkedNeurons[i*3+2].activation = this._eyeValues[2]/255;
			/*
			if(this._eyeValues[0]+this._eyeValues[1]+this._eyeValues[2] > 0) {
				console.log("Distance = "+(i*5)+"px => "+this._eyeValues[0]+";"+this._eyeValues[1]+";"+this._eyeValues[2]);
			}
			*/
		}
	}

	draw(graphics, parent) {
		let r = Math.round(this.linkedNeurons[12].activation*255);
		let g = Math.round(this.linkedNeurons[13].activation*255);
		let b = Math.round(this.linkedNeurons[14].activation*255);
		//console.log(r+" "+g+" "+b);
		this.color = PIXI.utils.rgb2hex([r, g, b]);
		super.draw(graphics, parent);
	}
}


Motor = class Motor extends Limb {
	constructor(data) {
		super(data);
		this.type = OUTPUT_LIMB;
		this.neededNeurons = 2;
		this.class = "Motor";
		this.color = 0x4ff441;
	}

	draw(graphics, parent) {
		super.draw(graphics, parent);
	}
}

tryToFindPositionForLimb = function(angle, sensors, motors) {

}

Being = class Being {
	constructor(DNAObject, startEnergy, x, y) {
		
		if(!DNAObject 
		|| !DNAObject.sensors 
		|| !DNAObject.motors 
		|| !DNAObject.neuralSystem
		|| !DNAObject.energyNeuron
		|| !DNAObject.damageNeuron
		|| !DNAObject.ageNeuron
		|| !DNAObject.reproductionNeuron) {
			throw new SyntaxError("Invalid global DNA structure : "+JSON.stringify(DNAObject));
		}
		
		// Neural System loading
		this.neuralSystem = new NeuralSystem(DNAObject.neuralSystem);
		
		// Limbs loading
		this.sensors = [];
		this.motors = [];
		for(let sensorDNA of DNAObject.sensors) {
			// Try to create limb object

			let sensor = new window[sensorDNA.class](sensorDNA);
			
			// Attach neurons to it according to DNA
			for(let neuronID of sensorDNA.linkedNeurons) {
				sensor.linkedNeurons.push(this.neuralSystem.inputs[neuronID]);
			}
			this.sensors.push(sensor);
		}
		
		for(let motorDNA of DNAObject.motors) {
			// Create limb object
			let motor = new window[motorDNA.class](motorDNA);
			
			// Attach neurons to it according to DNA
			for(let neuronID of motorDNA.linkedNeurons) {
				motor.linkedNeurons.push(this.neuralSystem.outputs[neuronID]);
			}
			this.motors.push(motor);
		}
		


		// Create body data fields and attach neurons
		this.energy = startEnergy;
		if(!startEnergy) {this.energy = 1000;}
		this.energyNeuron = this.neuralSystem.inputs[DNAObject.energyNeuron];
		
		this.damage = 0;
		this.damageNeuron = this.neuralSystem.inputs[DNAObject.damageNeuron];
		
		this.tick = 0;
		this.ageNeuron = this.neuralSystem.inputs[DNAObject.ageNeuron];
		
		this.reproductionNeuron = this.neuralSystem.outputs[DNAObject.reproductionNeuron];
		
		this.body = Physics.body('circle', {
			x: x,
			y: y,
			radius: 32
		});

		world.physicsWorld.add(this.body);
	}
	
	computeDNA() {
		let sensors = [];
		let motors =[];
		
		this.sensors.forEach(function(sensor) {
			sensors.push(sensor.computeDNA());
		});
		
		this.motors.forEach(function(motor) {
			motors.push(motor.computeDNA());
		});
		
		return {
			energyNeuron: this.energyNeuron.localID,
			damageNeuron : this.damageNeuron.localID,
			ageNeuron : this.ageNeuron.localID,
			reproductionNeuron : this.reproductionNeuron.localID,
			sensors: sensors,
			motors: motors,
			neuralSystem: this.neuralSystem.computeDNA()
		}
	}

	update(world) {
		this.tick+=1;
		
		this.damageNeuron.activate(this.damage);
		this.energyNeuron.activate(this.energy);
		

		let parent = {x: this.body.state.pos.x, 
					  y: this.body.state.pos.y, 
					  angle: this.body.state.angular.pos};

		for(let sensor of sensors) {
			sensor.update(world, parent);
		}

		for(let motor of motors) {
			motor.update(world, parent);
		}

		let being = this;

		Object.values(this.neuralSystem.inputs).forEach(function(neuron){
			neuron.activateNetwork(being.tick);
		});
		
		let max = 0.0005;
		let min = -0.0005;
		let x = Math.random()*(max-min)+min;
		let y = Math.random()*(max-min)+min;
		let force = {x: x, y: y};
		this.body.applyForce(force);
	}

	draw(world) {
		let graphics = world.graphics;
		let x = this.body.state.pos.x;
		let y = this.body.state.pos.y;
		let angle = this.body.state.angular.pos;
		let parent = {x: x, y: y, angle: angle};

		graphics.beginFill(0x9966FF);
		graphics.drawCircle(x, y, 32);
		graphics.endFill();

		
		graphics.beginFill(0x41e8f4);
		graphics.drawCircle(x, y, 24);
		graphics.endFill();


		for(let sensor of Object.values(this.sensors)) {
			sensor.draw(graphics, parent);
		}

		for(let motor of Object.values(this.motors)) {
			motor.draw(graphics, parent);
		}
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


/*********************
RANDOM BUILDING PART

Functions below are made to build random DNA
*********************/
buildRandomNeuralSystem = function(inputNumber, outputNumber) {
	let inputs = {};
	let outputs = {};
	let neurons = {};
	
	// Produce input neurons
	for(let i=0; i<inputNumber; i++) {
		let neuron = new Neuron();
		inputs[neuron.ID] = neuron;
	}
	
	// produce output neurons
	for(let i=0; i<outputNumber; i++) {
		let neuron = new Neuron();
		outputs[neuron.ID] = neuron;
	}
	
	// produce central neural system neurons
	let systemSize = 40;
	let numberOfConnections = systemSize * 5;
	for(let i=0; i<systemSize; i++) {
		let neuron = new Neuron();
		neurons[neuron.ID] = neuron;
	}
	
	// "randomly" link neurons
	// internal connections
	for(let i=0; i<numberOfConnections; i++) {
		let from = Object.values(neurons)[ Math.floor(Math.random()*systemSize) ];
		let to = Object.values(neurons)[ Math.floor(Math.random()*systemSize) ];
		from.project(to);
	}
	
	for(let i=0; i<inputNumber*5; i++) {
		let from = Object.values(inputs)[ Math.floor(Math.random()*inputNumber) ];
		let to = Object.values(neurons)[ Math.floor(Math.random()*systemSize) ];
		from.project(to);
	}
	
	for(let i=0; i<outputNumber*5; i++) {
		let from = Object.values(neurons)[ Math.floor(Math.random()*systemSize) ];
		let to = Object.values(outputs)[ Math.floor(Math.random()*outputNumber) ];
		from.project(to);
	}
	
	// Now that we built a a random neural system, let's create an empty object, and feed it with theses objects
	emptyDNA = {inputs: [], outputs: [], neurons: []};	
	let neuralSystem = new NeuralSystem(emptyDNA);
	neuralSystem.inputs = inputs;
	neuralSystem.outputs = outputs;
	neuralSystem.neurons = neurons;
	
	return neuralSystem;
}

buildRandomSensors = function(number) {
	sensors = [];
	for(let i=0; i<number; i++) {
		let angle = (Math.floor(Math.random()*(360))) * Math.PI / 180;
		sensors.push(new RGBSensor({angle: angle}));
	}
	
	return sensors;
}

buildRandomMotors = function(number) {
	motors = [];
	for(let i=0; i<number; i++) {
		let angle = (Math.floor(Math.random()*(360))) * Math.PI / 180;
		motors.push(new Motor(({angle: angle})));
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

assignNeuronsToLimbs = function(sensors, motors, inputsArray, outputsArray) {
	let neuronCount = 0;
	let i=0;
	for(sensor of sensors) {
		for(let j=0; j<sensor.neededNeurons; j++) {
			sensor.linkedNeurons.push(inputsArray[i]);
			i++;
		}
	}

	i=0;
	for(motor of motors) {
		for(let j=0; j<motor.neededNeurons; j++) {
			motor.linkedNeurons.push(outputsArray[i]);
			i++;
		}
	}
}


/*
Builds a random Being DNA. This function builds a random usable Being DNA
*/
buildRandomBeingDNA = function() {
	DNAObject = {};
	
	
	// Build random limbs
	let sensors = buildRandomSensors( Math.floor(Math.random()*(5-1)+1) );
	let motors = buildRandomMotors( Math.floor(Math.random()*(5-1)+1) );
	
	
	// Build random neural system
	
	// +1 for energy info
	// +1 for damage info
	// +1 for age
	let inputNeuronsNumber = computeNeededNeuronsForLimbs(sensors);
	
	// +1 for reproduction decision
	let outputNeuronsNumber = computeNeededNeuronsForLimbs(motors);
	
	let neuralSystem = buildRandomNeuralSystem(inputNeuronsNumber+3, outputNeuronsNumber+1)
	
	// Attach neurons
	let inputsArray = Object.values(neuralSystem.inputs);
	let outputsArray = Object.values(neuralSystem.outputs);
	
	assignNeuronsToLimbs(sensors, motors, inputsArray, outputsArray);
	
	// Build final DNA object
	DNAObject.neuralSystem = neuralSystem.computeDNA();
	DNAObject.energyNeuron = inputsArray[inputNeuronsNumber].localID; //-1 +1
	DNAObject.damageNeuron = inputsArray[inputNeuronsNumber+1].localID;
	DNAObject.ageNeuron = inputsArray[inputNeuronsNumber+2].localID;
	DNAObject.reproductionNeuron = outputsArray[outputNeuronsNumber].localID; //-1 +1
	DNAObject.sensors = [];
	DNAObject.motors = [];
	
	sensors.forEach(function(sensor) {
		DNAObject.sensors.push(sensor.computeDNA());
	});
	
	motors.forEach(function(motor) {
		DNAObject.motors.push(motor.computeDNA());
	});
	
	return DNAObject;
}

buildRandomBeing = function(world) {
	let x = Math.floor(Math.random()*(world.renderer.width-64-64)+64);
	let y = Math.floor(Math.random()*(world.renderer.height-64-64)+64);
	
	let being = new Being(buildRandomBeingDNA(), 1500, x, y);
	
	return being;
}

console.log("Initialized classes and all that kind of stuff");