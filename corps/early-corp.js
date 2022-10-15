/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("ALL");

	const analyzefile = "/analyze-corp.txt";
	const corp = "corp";
	const all_divisions = ["Software", "Agriculture", "Fishing", "Chemical", "Tobacco", "Food"]
	const main_division = "Software";
	const cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];
	const prodMat = "AI Cores";
	const division_goals = [1]
	const employee_goals = [3]
	const storage_goals = [8]
	const speech_goals = [0]
	const dream_goals = [0]
	const smart_goals = [7]
	const project_goals = [0]
	const abc_goals = [0]
	const adv_goals = [3]
	const start = ns.getPlayer().playtimeSinceLastBitnode;


	await getCorp();
	let round = ns.corporation.getInvestmentOffer().round - 1;

	await prep()
	await party()
	await waitState("START")
	await takeOffer();
	await end()




	async function waitState(state, times = 1, onpoint = false) {
		for (let i = 0; i < times; i++) {
			while (ns.corporation.getCorporation().state != state) { await ns.sleep(11); }
			if (onpoint) {
				while (ns.corporation.getCorporation().state == state) { await ns.sleep(11); }
			}
		}
	}
	async function prep() {
		//divisions
		while (ns.corporation.getCorporation(corp).divisions.length < division_goals[round]) {
			let name = all_divisions[ns.corporation.getCorporation(corp).divisions.length]
			ns.corporation.expandIndustry(name, name);

		}
		//upgrades && unlocks
		while (ns.corporation.getUpgradeLevel("Smart Storage") < smart_goals[round]) { await ns.corporation.levelUpgrade("Smart Storage"); }
		while (ns.corporation.getUpgradeLevel("Project Insight") < project_goals[round]) { await ns.corporation.levelUpgrade("Project Insight") }
		while (ns.corporation.getUpgradeLevel("Neural Accelerators") < project_goals[round]) { await ns.corporation.levelUpgrade("Neural Accelerators") }
		while (ns.corporation.getUpgradeLevel("Nuoptimal Nootropic Injector Implants") < project_goals[round]) { await ns.corporation.levelUpgrade("Nuoptimal Nootropic Injector Implants") }
		while (ns.corporation.getUpgradeLevel("FocusWires") < project_goals[round]) { await ns.corporation.levelUpgrade("FocusWires") }
		while (ns.corporation.getUpgradeLevel("Speech Processor Implants") < speech_goals[round]) { await ns.corporation.levelUpgrade("Speech Processor Implants"); }
		while (ns.corporation.getUpgradeLevel("DreamSense") < dream_goals[round]) { await ns.corporation.levelUpgrade("DreamSense"); }
		while (ns.corporation.getUpgradeLevel("ABC SalesBots") < abc_goals[round]) { await ns.corporation.levelUpgrade("ABC SalesBots"); }

		//prep each division & city
		for (const division of ns.corporation.getCorporation().divisions) {
			//expand to all cities in all divisions
			while (ns.corporation.getDivision(division.name).cities.length < cities.length) {
				for (let city of cities) { if (!ns.corporation.getDivision(division.name).cities.includes(city)) { await ns.corporation.expandCity(division.name, city); } }

			}
			//buy some ads 
			while (ns.corporation.getHireAdVertCount(division.name) < adv_goals[round]) { await ns.corporation.hireAdVert(division.name); }
			//buy Warehouses
			for (let city of cities) {
				if (ns.corporation.hasWarehouse(division.name, city) == false) { await ns.corporation.purchaseWarehouse(division.name, city); }
			}
			//prep each city to goal
			for (let city of cities) {
				//upgrade Warehouses to current goal
				while (ns.corporation.getWarehouse(division.name, city).level < storage_goals[round]) { await ns.corporation.upgradeWarehouse(division.name, city); await ns.sleep(1) }
				//upgrade Office size to goal
				while (ns.corporation.getOffice(division.name, city).size < employee_goals[round]) { ns.corporation.upgradeOfficeSize(division.name, city, 3); }
				//hire to max
				while (ns.corporation.getOffice(division.name, city).employees.length < ns.corporation.getOffice(division.name, city).size) { await ns.corporation.hireEmployee(division.name, city); }

				//make sure we have mats for qlt update later
				if (division.name == main_division) {
					ns.corporation.buyMaterial(division.name, city, "Energy", 0.01)
					ns.corporation.buyMaterial(division.name, city, "Hardware", 0.01)
				}
			}
		}
	}
	async function party() {

		for (const division of ns.corporation.getCorporation().divisions) {
			for (let city of cities) {
				await ns.corporation.setAutoJobAssignment(division.name, city, "Business", 0);
				await ns.corporation.setAutoJobAssignment(division.name, city, "Operations", 0);
				await ns.corporation.setAutoJobAssignment(division.name, city, "Engineer", 0);
				await ns.corporation.setAutoJobAssignment(division.name, city, "Management", 0);
				await ns.corporation.setAutoJobAssignment(division.name, city, "Research & Development", ns.corporation.getOffice(division.name, city).employees.length);
			}

		}
		let done = 0;
		while (done < ns.corporation.getCorporation().divisions.length) {
			done = 0;
			for (const division of ns.corporation.getCorporation().divisions) {
				let d_mor = 0;
				let d_ene = 0;
				let d_hap = 0;
				for (let city of cities) {
					let tmorale = 0;
					let tenergy = 0;
					let thappiness = 0;
					ns.corporation.getOffice(division.name, city).employees.forEach(x => tmorale += ns.corporation.getEmployee(division.name, city, x).mor);
					ns.corporation.getOffice(division.name, city).employees.forEach(x => tenergy += ns.corporation.getEmployee(division.name, city, x).ene);
					ns.corporation.getOffice(division.name, city).employees.forEach(x => thappiness += ns.corporation.getEmployee(division.name, city, x).hap);
					tmorale = tmorale / ns.corporation.getOffice(division.name, city).employees.length;
					tenergy = tenergy / ns.corporation.getOffice(division.name, city).employees.length;
					thappiness = thappiness / ns.corporation.getOffice(division.name, city).employees.length;
					let party = 3e6 * (round + 1);
					tmorale > 99.8 && thappiness > 99.8 ? party = 1e5 : null;
					tmorale < 100 || thappiness < 100 ? ns.corporation.throwParty(division.name, city, party) : null;
					tenergy < 100 ? ns.corporation.buyCoffee(division.name, city) : null;

					tmorale > 99.9 ? d_mor += 1 : null;
					tenergy > 99.9 ? d_ene += 1 : null;
					thappiness > 99.9 ? d_hap += 1 : null;
				}
				d_mor == 6 && d_ene == 6 && d_hap == 6 ? done++ : null;
			}
			await waitState("START", 1, true)
		}
	}
	async function takeOffer() {
		//we buy a ton of cores to sell them later the cores we produce set the quality
		for (const division of ns.corporation.getCorporation().divisions) {
			for (let city of cities) {
				await ns.corporation.setAutoJobAssignment(division.name, city, "Research & Development", 0);
				//we need engineers to produce and the more the higher the qlt gained 
				await ns.corporation.setAutoJobAssignment(division.name, city, "Engineer", ns.corporation.getOffice(division.name, city).employees.length);
				//we leave a bit of space for so we can actually produce high qlt cores
				const amt = ns.corporation.getWarehouse(division.name, city).size - ns.corporation.getWarehouse(division.name, city).sizeUsed - 5;
				ns.corporation.buyMaterial(division.name, city, "AI Cores", amt);
			}
		}
		//wait for warehouse to fill
		while (ns.corporation.getWarehouse(main_division, cities[0]).sizeUsed < ns.corporation.getWarehouse(main_division, cities[0]).size - 5) { await ns.sleep(100) }
		//reset buys to 0
		for (const division of ns.corporation.getCorporation().divisions) { for (let city of cities) { ns.corporation.buyMaterial(division.name, city, "AI Cores", 0) } }
		//set employees for fraud
		for (const division of ns.corporation.getCorporation().divisions) {
			for (let city of cities) {

				await ns.corporation.setAutoJobAssignment(division.name, city, "Research & Development", 0);
				await ns.corporation.setAutoJobAssignment(division.name, city, "Operations", 0);
				await ns.corporation.setAutoJobAssignment(division.name, city, "Engineer", 0);
				await ns.corporation.setAutoJobAssignment(division.name, city, "Management", 0);
				await ns.corporation.setAutoJobAssignment(division.name, city, "Business", ns.corporation.getOffice(division.name, city).employees.length);
			}
		}

		await waitState("EXPORT")
		//we make sure that we dont sell anything early :3
		for (const division of ns.corporation.getCorporation().divisions) {
			for (let city of cities) {
				ns.corporation.sellMaterial(division.name, city, prodMat, "MAX", "MP");
			}
		}
		//we wait for 5 cycles so the game forgets all bad cycles and we wait for "START" to end to be sure that the Offer is at its peak
		await waitState("START", 5, true)

		const offer = ns.corporation.getInvestmentOffer().funds;
		await ns.corporation.acceptInvestmentOffer();
		round++
		analyze(offer);
	}
	async function end() {
		!ns.corporation.hasUnlockUpgrade("Smart Supply") && ns.corporation.getUpgradeLevelCost("Smart Supply") < ns.corporation.getCorporation().funds ? ns.corporation.unlockUpgrade("Smart Supply") : null;

		for (const division of ns.corporation.getCorporation().divisions) {
			for (let city of cities) {
				ns.corporation.setSmartSupply(division.name, city, true)
				await ns.corporation.setAutoJobAssignment(division.name, city, "Business", 0);
				await ns.corporation.setAutoJobAssignment(division.name, city, "Research & Development", ns.corporation.getOffice(division.name, city).employees.length / 3);
				await ns.corporation.setAutoJobAssignment(division.name, city, "Engineer", ns.corporation.getOffice(division.name, city).employees.length / 3);
				await ns.corporation.setAutoJobAssignment(division.name, city, "Management", ns.corporation.getOffice(division.name, city).employees.length / 3);


			}
		}
		ns.exit();
	}
	async function getCorp() {
		let player = ns.getPlayer();
		if (!player.hasCorporation) {
			if (player.bitNodeN == 3) {
				ns.corporation.createCorporation(corp, false);
			} else {
				while (ns.getPlayer().money < 15e+10) {
					ns.clearLog();
					ns.print("Waiting for Money to create Corp");
					await ns.sleep(30 * 1000);
				}
				ns.corporation.createCorporation(corp, true);
			}
		}
	}

	function analyze(offer) {
		const end = ns.getPlayer().playtimeSinceLastBitnode;
		const runtime = ns.tFormat(end - start);
		const result = round + ": " + offer + " after " + runtime;
		round == 1 ? ns.write(analyzefile, "\n" + result, "a") : ns.write(analyzefile, " " + result, "a");

	}
}
