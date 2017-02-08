



NeuralSystem = class NeuralSystem {
	constructor(DNA) {
		var DNAObject = DNA;

		if(DNA instanceof String) {
			DNAObject = JSON.parse(DNA);
		}

		if(!DNAObject) {
			DNAObject = {inputs: [], outputs: [], neurons: []};
		}
		if(!DNAObject.inputs) {
			DNAObject.inputs = [];
		}
		if(!DNAObject.outputs) {
			DNAObject.outputs = [];
		}
		if(!DNAObject.neurons) {
			DNAObject.neurons = [];
		}

		this.inputs  = DNAObject.inputs;
		this.outputs = DNAObject.outputs;
		this.neurons = DNAObject.neurons;
	}
}



Limb = class Limb {
	constructor(data) {
		this.angle = data.angle;
	}

	draw() {}
	update() {}
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

		if(!DNAObject || !DNAObject.limbs || !DNAObject.neuralSystem) {
			throw new SyntaxError("Invalid DNA :"+JSON.stringify(DNAObject));
		}

		// Limbs loading
		this.limbs = [];
		var limbArray = DNAObject.limbs;
		for(limb of limbArray) {
			this.limbs.push(new Limb(limb));
		}

		// Neural System loading
		this.neuralSystem = new NeuralSystem(DNAObject.neuralSystem);
	}

	computeDNA() {
		return JSON.stringify(this);
	}
}


console.log("Initialized being values");