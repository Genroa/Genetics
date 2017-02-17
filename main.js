



world = new World(800, 900);
for(let i=0; i<50;i++) {
	world.addBeing(buildRandomBeing(world));
}
world.run();
// world.stop();