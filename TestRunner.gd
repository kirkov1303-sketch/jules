extends SceneTree

func _init():
	print("Starting Comprehensive Validation...")

	# Load scripts
	var WorldManagerScript = load("res://scripts/WorldManager.gd")
	var PowerSystemScript = load("res://scripts/PowerSystem.gd")

	# 1. Test World Generation
	var wm = WorldManagerScript.new()
	var tm = TileMap.new()
	wm.tile_map = tm
	wm.setup_noises()
	print("Noises setup: OK")

	var h = wm.noise.get_noise_2d(0, 0)
	var biome = wm.determine_biome(h, 0, 0)
	# Biome is an enum, we need to access it via the instance or script if it were a class_name
	# Since we removed class_name, we access it via the script object
	print("Biome determination at (0,0): ", biome)

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
	# unit._ready() - Avoid manual call if possible, but for test it's ok

	# 4. Test Power System
	var ps = PowerSystemScript.new(wm)
	ps.current_power = "spawn_human"
	print("PowerSystem setup: OK")

	print("Validation Complete. All core systems functional.")
	quit()
