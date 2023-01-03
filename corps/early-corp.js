/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("ALL");
	const CorpApi = ns.corporation
	const analyzefile = "/analyze-corp.txt";
	const corp = "corp";
	const all_divisions = ["Software"]
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
	let round = CorpApi.getInvestmentOffer().round - 1;

	await prep()
	await party()
	await waitState("START")
	await takeOffer();
	await end()




	async function waitState(state, times = 1, onpoint = false) {
		for (let i = 0; i < times; i++) {
			while (CorpApi.getCorporation().state != state) { await ns.sleep(11); }
			if (onpoint) {
				while (CorpApi.getCorporation().state == state) { await ns.sleep(11); }
			}
		}
	}
	async function prep() {
		//divisions
		while (CorpApi.getCorporation(corp).divisions.length < division_goals[round]) {
			let name = all_divisions[CorpApi.getCorporation(corp).divisions.length]
			CorpApi.expandIndustry(name, name);

		}
		//upgrades && unlocks
		while (CorpApi.getUpgradeLevel("Smart Storage") < smart_goals[round]) { await CorpApi.levelUpgrade("Smart Storage"); }
		while (CorpApi.getUpgradeLevel("Project Insight") < project_goals[round]) { await CorpApi.levelUpgrade("Project Insight") }
		while (CorpApi.getUpgradeLevel("Neural Accelerators") < project_goals[round]) { await CorpApi.levelUpgrade("Neural Accelerators") }
		while (CorpApi.getUpgradeLevel("Nuoptimal Nootropic Injector Implants") < project_goals[round]) { await CorpApi.levelUpgrade("Nuoptimal Nootropic Injector Implants") }
		while (CorpApi.getUpgradeLevel("FocusWires") < project_goals[round]) { await CorpApi.levelUpgrade("FocusWires") }
		while (CorpApi.getUpgradeLevel("Speech Processor Implants") < speech_goals[round]) { await CorpApi.levelUpgrade("Speech Processor Implants"); }
		while (CorpApi.getUpgradeLevel("DreamSense") < dream_goals[round]) { await CorpApi.levelUpgrade("DreamSense"); }
		while (CorpApi.getUpgradeLevel("ABC SalesBots") < abc_goals[round]) { await CorpApi.levelUpgrade("ABC SalesBots"); }

		//prep each division & city
		for (const division of CorpApi.getCorporation().divisions) {
			//expand to all cities in all divisions
			while (CorpApi.getDivision(division).cities.length < cities.length) {
				for (let city of cities) { if (!CorpApi.getDivision(division).cities.includes(city)) { await CorpApi.expandCity(division, city); } }

			}
			//buy some ads 
			while (CorpApi.getHireAdVertCount(division) < adv_goals[round]) { await CorpApi.hireAdVert(division); }
			//buy Warehouses
			for (let city of CorpApi.getDivision(division).cities) {
				if (CorpApi.hasWarehouse(division, city) == false) { await CorpApi.purchaseWarehouse(division, city); }
			}
			//prep each city to goal
			for (let city of CorpApi.getDivision(division).cities) {
				//upgrade Warehouses to current goal
				while (CorpApi.getWarehouse(division, city).level < storage_goals[round]) { await CorpApi.upgradeWarehouse(division, city); await ns.sleep(1) }
				//upgrade Office size to goal
				while (CorpApi.getOffice(division, city).size < employee_goals[round]) { CorpApi.upgradeOfficeSize(division, city, 3); }
				//hire to max
				while (CorpApi.getOffice(division, city).employees < CorpApi.getOffice(division, city).size) { await CorpApi.hireEmployee(division, city); }

				//make sure we have mats for qlt update later
				if (division == main_division) {
					CorpApi.buyMaterial(division, city, "Energy", 0.01)
					CorpApi.buyMaterial(division, city, "Hardware", 0.01)
				}
			}
		}
	}
	async function party() {
		for (const division of CorpApi.getCorporation().divisions) {
			for (let city of CorpApi.getDivision(division).cities) {
				await CorpApi.setAutoJobAssignment(division, city, "Business", 0);
				await CorpApi.setAutoJobAssignment(division, city, "Operations", 0);
				await CorpApi.setAutoJobAssignment(division, city, "Engineer", 0);
				await CorpApi.setAutoJobAssignment(division, city, "Management", 0);
				await CorpApi.setAutoJobAssignment(division, city, "Research & Development", CorpApi.getOffice(division, city).employees);
			}

		}
		let done = 0;
		while (done < CorpApi.getCorporation().divisions.length) {
			done = 0;
			for (const division of CorpApi.getCorporation().divisions) {
				let d_mor = 0;
				let d_ene = 0;
				let d_hap = 0;
				for (let city of cities) {
					const cMorale = CorpApi.getOffice(division, city).avgMor;
					const cEnergy = CorpApi.getOffice(division, city).avgEne;
					const cHappiness = CorpApi.getOffice(division, city).avgHap;
					
					let party = cMorale > 99.8 && cHappiness > 99.8 ? 1e5: 3e6 * (round + 1);
					cMorale < 100 || cHappiness < 100 ? CorpApi.throwParty(division, city, party) : null;
					cEnergy < 100 ? CorpApi.buyCoffee(division, city) : null;
					
					cMorale > 99.5 ? d_mor += 1 : null;
					cEnergy > 99.5 ? d_ene += 1 : null;
					cHappiness > 99.5 ? d_hap += 1 : null;
				}
				d_mor == 6 && d_ene == 6 && d_hap == 6 ? done++ : null;
			}
			await waitState("START", 1, true)
		}
	}
	async function takeOffer() {
		//we buy a ton of cores to sell them later the cores we produce set the quality
		for (const division of CorpApi.getCorporation().divisions) {
			for (let city of CorpApi.getDivision(division).cities) {
				await CorpApi.setAutoJobAssignment(division, city, "Research & Development", 0);
				//we need engineers to produce and the more the higher the qlt gained 
				await CorpApi.setAutoJobAssignment(division, city, "Engineer", CorpApi.getOffice(division, city).employees);
				//we leave a bit of space for so we can actually produce high qlt cores
				const amt = CorpApi.getWarehouse(division, city).size - CorpApi.getWarehouse(division, city).sizeUsed - 5;
				CorpApi.buyMaterial(division, city, prodMat, amt);
			}
		}
		//wait for warehouse to fill
		while (CorpApi.getWarehouse(main_division, CorpApi.getDivision(main_division).cities[0]).sizeUsed < CorpApi.getWarehouse(main_division, CorpApi.getDivision(main_division).cities[0]).size - 5) { await ns.sleep(100) }
		//reset buys to 0
		for (const division of CorpApi.getCorporation().divisions) { for (let city of CorpApi.getDivision(division).cities) { CorpApi.buyMaterial(division, city, prodMat, 0) } }
		//set employees for fraud
		for (const division of CorpApi.getCorporation().divisions) {
			for (let city of CorpApi.getDivision(division).cities) {

				await CorpApi.setAutoJobAssignment(division, city, "Research & Development", 0);
				await CorpApi.setAutoJobAssignment(division, city, "Operations", 0);
				await CorpApi.setAutoJobAssignment(division, city, "Engineer", 0);
				await CorpApi.setAutoJobAssignment(division, city, "Management", 0);
				await CorpApi.setAutoJobAssignment(division, city, "Business", CorpApi.getOffice(division, city).employees);
			}
		}

		await waitState("EXPORT")
		//we make sure that we dont sell anything early :3
		for (const division of CorpApi.getCorporation().divisions) {
			for (let city of CorpApi.getDivision(division).cities) {
				CorpApi.sellMaterial(division, city, prodMat, "MAX", "MP");
			}
		}
		//we wait for 5 cycles so the game forgets all bad cycles and we wait for "START" to end to be sure that the Offer is at its peak
		await waitState("START", 5, true)

		const offer = CorpApi.getInvestmentOffer().funds;
		await CorpApi.acceptInvestmentOffer();
		round++
		ns.print("We got an offer of " + offer)
		analyze(offer);
	}
	async function end() {
		!CorpApi.hasUnlockUpgrade("Smart Supply") && CorpApi.getUnlockUpgradeCost("Smart Supply") < CorpApi.getCorporation().funds ? CorpApi.unlockUpgrade("Smart Supply") : null;

		for (const division of CorpApi.getCorporation().divisions) {
			for (let city of CorpApi.getDivision(division).cities) {
				CorpApi.setSmartSupply(division, city, true)
				await CorpApi.setAutoJobAssignment(division, city, "Business", 0);
				await CorpApi.setAutoJobAssignment(division, city, "Research & Development", CorpApi.getOffice(division, city).employees / 3);
				await CorpApi.setAutoJobAssignment(division, city, "Engineer", CorpApi.getOffice(division, city).employees / 3);
				await CorpApi.setAutoJobAssignment(division, city, "Management", CorpApi.getOffice(division, city).employees / 3);
			}
		}
		ns.exit();
	}
	async function getCorp() {
		let player = ns.getPlayer();
		if (!player.hasCorporation) {
			if (player.bitNodeN == 3) {
				CorpApi.createCorporation(corp, false);
			} else {
				while (ns.getPlayer().money < 15e+10) {
					ns.clearLog();
					ns.print("Waiting for Money to create Corp");
					await ns.sleep(30 * 1000);
				}
				CorpApi.createCorporation(corp, true);
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
