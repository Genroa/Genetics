
/************
DON'T INCLUDE THIS IN YOUR PROJECT.
*************/

{
	energyNeuron : localFID,
	
	damageNeuron : localFID,
	
	ageNeuron : localFID,
	
	reproductionNeuron : localFID,

	sensors: [
		{
			class: "RGBSensor",
			linkedNeurons: [localFID, localFID, localFID],
			angle: 45
		},
		{
			class: "RGBSensor",
			linkedNeurons: [localFID, localFID, localFID],
			angle: 90
		}
	],
	
	motors: [
		{
			class: "Motor",
			linkedNeurons: [localFID, localFID],
			angle: 109
		},
		{
			class: "Motor",
			linkedNeurons: [localFID, localFID],
			angle: 158
		}
	],
	
	neuralSystem: {
		inputs: {
			...
		},
		
		outputs: {
			...
		},
		
		neurons: {
			localFID: {
				localFID: localFID,
				connections: [
					{
						to: localFID,
						weight: 0.4
					},
					...
				]
			},
			...
		}
	}
}