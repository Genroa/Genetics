



world = new World(800, 600);
for(let i=0; i<5;i++) {
	world.addBeing(buildRandomBeing(world));
}
world.run();
// world.stop();