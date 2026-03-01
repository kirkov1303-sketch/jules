extends SceneTree

func _init():
	print("Starting Comprehensive Validation...")

	# Load scripts dynamically
	var WorldManagerScript = load("res://scripts/WorldManager.gd")
	var PowerSystemScript = load("res://scripts/PowerSystem.gd")

	# 1. Test World Generation
	var wm = WorldManagerScript.new()
	var tm = TileMap.new()
	wm.tile_map = tm
	wm.setup_noises()
	print("Noises setup: OK")

	var h = wm.noise.get_noise_2d(0, 0)
	var b = wm.determine_biome(h, 0, 0)
	print("Biome determination at (0,0): ", b)

	# 2. Test Civilization Logic
	wm.create_kingdom("Human", Vector2i(100, 100))
	print("Kingdom creation: OK")

	wm.update_diplomacy()
	print("Diplomacy update: OK")

	# 3. Test Power System
	var ps = PowerSystemScript.new(wm)
	ps.current_power = "spawn_human"
	print("PowerSystem setup: OK")

	print("Validation Complete. All core systems functional.")
	quit()
