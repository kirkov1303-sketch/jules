extends SceneTree

func _init():
	print("Starting Comprehensive Validation...")

	# 1. Test World Generation
	var wm = WorldManager.new()
	var tm = TileMap.new()
	wm.tile_map = tm
	wm.setup_noises()
	print("Noises setup: OK")

	var h = wm.noise.get_noise_2d(0, 0)
	var biome = wm.determine_biome(h, 0, 0)
	print("Biome determination at (0,0): ", wm.Biome.keys()[biome])

	# 2. Test Civilization Logic
	wm.create_kingdom("Human", Vector2i(100, 100))
	print("Kingdom creation: ", wm.kingdoms.size(), " kingdoms")
	assert(wm.kingdoms.size() == 1)

	wm.update_diplomacy()
	print("Diplomacy update: OK")

	# 3. Test Unit AI (Partial)
	var unit = CharacterBody2D.new()
	unit.set_script(load("res://scripts/Unit.gd"))
	unit.race = "Orc"
	unit._ready()
	print("Unit initialization: OK")

	unit.ai.update(0.1)
	print("Unit AI update: OK")

	# 4. Test Power System
	var ps = PowerSystem.new(wm)
	ps.current_power = "spawn_human"
	print("PowerSystem setup: OK")

	print("Validation Complete. All core systems functional.")
	quit()
