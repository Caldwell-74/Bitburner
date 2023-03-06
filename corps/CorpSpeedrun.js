import { BnValData, ValData } from 'CorpValData.js';
const CORP_FILE = 'corp.txt';
/** 
1.0 with alot of botched stuff still inside of it wich i might or might not redo :P
eg. changing jobs is janky af because of the bugs that where present after the Employee changes

needs CorpValData.js wich has currently DataSets for Corp Valuation 0.5-1.0

*/


/** @param {import("../").NS} ns */
export async function main(ns) {
  ns.tail();
  ns.disableLog('ALL');

  const disableLogging = false;
  const LOW_VAL = ValData.reduce((a, b) => (a.Val < b.Val ? a : b), ValData[0]).Val;
  const all_divisions = [
    'Software',
    'Real Estate',
    'Tobacco',
    'Food',
    'Agriculture',
    'Fishing',
    'Chemical',
    'Energy',
    'Water Utilities',
    'Mining',
    'Pharmaceutical',
    'Computer Hardware',
    'Robotics',
    'Healthcare',
  ];
  const cities = ['Aevum', 'Chongqing', 'Sector-12', 'New Tokyo', 'Ishima', 'Volhaven'];
  const upgrades = [
    'Project Insight',
    'Smart Factories' /*,"Smart Storage"*/,
    'Speech Processor Implants',
    'Neural Accelerators',
    'FocusWires',
    'ABC SalesBots',
    'Nuoptimal Nootropic Injector Implants',
  ];
  const analyzefile = '/analyze-corp.txt';
  const ROUND_MAX = 4;
  const ProdsForFour = 2;
  const a_research = [
    'Automatic Drug Administration',
    'CPH4 Injections',
    'Drones',
    'Drones - Assembly',
    'Go-Juice',
    'JoyWire',
    'Overclock',
    'Self-Correcting Assemblers',
    'Sti.mu',
  ];
  const b_research = ['AutoBrew', 'AutoPartyManager', 'Drones - Transport'];
  const VALUATION = await CheckSFandVal(ns);
  if (VALUATION < LOW_VAL) {
    DoublePrint(ns, 'No Clue what to do on this Valuation exiting Corp.js ...');
    ns.exit();
  }
  class Corp {
    constructor(ns) {
      this.ns = ns;
      this.Corp = this.ns.corporation;
      this.Round = Number;
      this.start = Number;
      this.counter = Number;

      this.dataSet = {};

      this.offers = [];
      this.times = [];
      this.products = [];
      this.temp = false;

      //goals
      this.firstproduct = false;
      this.Goal_30 = false;
      this.Goal_70 = false;
      this.Goal_100 = false;
    }
    async Main() {
      await this.CreateCorp();
      if (!disableLogging) this.CheckGoals();
      while (true) {
        this.Round = this.Corp.getInvestmentOffer().round - 1;
        this.funds = this.Corp.getCorporation().funds;
        this.data = this.dataSet[Math.min(this.Round, this.dataSet.length - 1)];
        this.PRODUCT = this.data.mode === 'product';
        await this.Loop();
      }
    }
    async Loop() {
      do {
        await this.Prep();
        await this.Party();
        if (this.PRODUCT) await this.ProductLoop();
        await this.WaitState('START', 1, this.PRODUCT);
        if (!this.PRODUCT) {
          await this.TakeOffer();
        } else {
          if (this.Corp.getInvestmentOffer().funds >= 1e70) {
            this.offers.push(this.Corp.getInvestmentOffer().funds);
            this.Corp.acceptInvestmentOffer();
            this.Round += 1;
            this.times.push(this.ns.getPlayer().playtimeSinceLastBitnode - this.start);
            this.Analyze(0);
            this.GoPublic();
          }
        }
      } while (this.PRODUCT);
    }

    async WaitState(state, times = 1, onpoint = false) {
      for (let i = 0; i < times; i++) {
        while (this.Corp.getCorporation().state !== state) {
          await this.ns.asleep(103);
        }
        if (onpoint) {
          while (this.Corp.getCorporation().state === state) {
            await this.ns.asleep(104);
          }
        }
      }
    }
    async Prep() {
      this.ns.print('Prepping...');

      while (this.Corp.getCorporation().divisions.length < this.data.division_goal) {
        if (!this.Corp.getCorporation().divisions.includes(this.data.m_division)) {
          await this.Corp.expandIndustry(this.data.m_division, this.data.m_division);
        } else {
          const notOpen = all_divisions.filter((div) => !this.Corp.getCorporation().divisions.includes(div));
          const cheapest = notOpen.reduce((a, b) => this.Corp.getIndustryData(a).startingCost < this.Corp.getIndustryData(b).startingCost ? a : b, notOpen[0])
          await this.Corp.expandIndustry(cheapest, cheapest);

        }
      }
      for (const division of this.Corp.getCorporation().divisions) {
        while (this.Corp.getDivision(division).cities.length < cities.length) {
          for (let city of cities) {
            if (!this.Corp.getDivision(division).cities.includes(city)) {
              await this.Corp.expandCity(division, city);
            }
            if (this.Corp.hasWarehouse(division, city) == false) {
              await this.Corp.purchaseWarehouse(division, city);
            }
          }
        }
      }

      while (this.Corp.getUpgradeLevel('Smart Storage') < this.data.smart_goal) {
        await this.Corp.levelUpgrade('Smart Storage');
      }
      while (this.Corp.getUpgradeLevel('Project Insight') < this.data.project_goal) {
        await this.Corp.levelUpgrade('Project Insight');
      }
      if (this.offer > 3e12 || this.Round >= 2) {
        while (this.Corp.getUpgradeLevel('Neural Accelerators') < this.data.stat_goal) {
          await this.Corp.levelUpgrade('Neural Accelerators');
        }
      }
      if (this.offer > 3e12 || this.Round >= 2) {
        while (this.Corp.getUpgradeLevel('Nuoptimal Nootropic Injector Implants') < this.data.stat_goal) {
          await this.Corp.levelUpgrade('Nuoptimal Nootropic Injector Implants');
        }
      }
      while (this.Corp.getUpgradeLevel('FocusWires') < this.data.stat_goal) {
        await this.Corp.levelUpgrade('FocusWires');
      }
      while (this.Corp.getUpgradeLevel('Speech Processor Implants') < this.data.speech_goal) {
        await this.Corp.levelUpgrade('Speech Processor Implants');
      }
      while (this.Corp.getUpgradeLevel('Smart Factories') < this.data.factory_goal) {
        await this.Corp.levelUpgrade('Smart Factories');
      }
      while (this.Corp.getUpgradeLevel('DreamSense') < this.data.dream_goal) {
        await this.Corp.levelUpgrade('DreamSense');
      }
      while (this.Corp.getUpgradeLevel('ABC SalesBots') < this.data.abc_goal) {
        await this.Corp.levelUpgrade('ABC SalesBots');
      }
      while (this.Corp.getUpgradeLevel('Wilson Analytics') < this.data.wilson_goal) {
        await this.Corp.levelUpgrade('Wilson Analytics');
      }

      if (this.Round > 0 && this.data.mode == 'fraud' && !this.Corp.hasUnlockUpgrade('Export')) {
        await this.Corp.unlockUpgrade('Export');
      }

      for (const division of this.Corp.getCorporation().divisions) {
        //buy adverts !
        while (this.Corp.getHireAdVertCount(division) < this.data.adv_goal) {
          await this.Corp.hireAdVert(division);
        }
        //prep each city to goal
        for (let city of cities) {
          while (this.Corp.getWarehouse(division, city).level < this.data.storage_goal) {
            await this.Corp.upgradeWarehouse(division, city);
          }
          while (this.Corp.getOffice(division, city).size < this.data.employee_goal) {
            this.Corp.upgradeOfficeSize(division, city, 3);
          }
          while (this.Corp.getOffice(division, city).employees < this.Corp.getOffice(division, city).size) {
            await this.Corp.hireEmployee(division, city);
            this.hired = true;
          }
          if (division == this.data.m_division && !this.Corp.hasUnlockUpgrade('Smart Supply')) {
            this.Corp.buyMaterial(division, city, 'Energy', 0.01);
            this.Corp.buyMaterial(division, city, 'Hardware', 0.01);
            if (this.Round == 1) {
              this.Corp.buyMaterial(division, city, 'Metal', 0.01);
              this.Corp.buyMaterial(division, city, 'Water', 0.01);
            }
          }
          if (this.Corp.hasUnlockUpgrade('Export') && division != this.data.m_division) {
            this.Corp.exportMaterial(this.data.m_division, cities[0], division, city, this.data.prodMat, 1);
          }
        }
      }
      if (this.Round == 1 && this.data.mode == 'fraud') {
        this.Corp.upgradeOfficeSize(this.data.m_division, cities[0], 6);
        while (
          this.Corp.getOffice(this.data.m_division, cities[0]).employees <
          this.Corp.getOffice(this.data.m_division, cities[0]).size
        ) {
          await this.Corp.hireEmployee(this.data.m_division, cities[0]);
          this.hired = true;
        }
      }
      if (this.Round == 2 && this.data.mode == 'fraud') {
        for (let city of cities) {
          this.Corp.upgradeOfficeSize(this.data.m_division, city, 60);
          while (
            this.Corp.getOffice(this.data.m_division, city).employees <
            this.Corp.getOffice(this.data.m_division, city).size
          ) {
            await this.Corp.hireEmployee(this.data.m_division, city);
            this.hired = true;
          }
        }
      }
      if (this.data.mode == 'product') {
        if (!this.Corp.hasUnlockUpgrade('Smart Supply')) {
          this.Corp.unlockUpgrade('Smart Supply');
          for (let i = 0; i < cities.length; i++) {
            this.Corp.setSmartSupply(this.data.m_division, cities[i], true);
          }
        }
        let max = this.Corp.getCorporation().funds / 100;

        while (
          this.Corp.getDivision(this.data.m_division).popularity < 1e308 &&
          this.Corp.getCorporation().funds > max
        ) {
          while (this.Corp.getCorporation().funds / 10 > this.Corp.getUpgradeLevelCost('Wilson Analytics')) {
            await this.Corp.levelUpgrade('Wilson Analytics');
          }
          while (
            this.Corp.getCorporation().funds > this.Corp.getHireAdVertCost(this.data.m_division) &&
            this.Corp.getDivision(this.data.m_division).popularity < 1e308
          ) {
            await this.Corp.hireAdVert(this.data.m_division);
            // await ns.asleep(2) if it breaks here i am
          }
          break;
        }
        max = this.Corp.getCorporation().funds / 2;

        while (
          this.Corp.getCorporation().funds > max &&
          this.Corp.getCorporation().funds / 2 > this.Corp.getOfficeSizeUpgradeCost(this.data.m_division, cities[0], 3)
        ) {
          await this.Corp.upgradeOfficeSize(this.data.m_division, cities[0], 3);
        }
        while (
          this.Corp.getOffice(this.data.m_division, cities[0]).employees <
          this.Corp.getOffice(this.data.m_division, cities[0]).size
        ) {
          // eslint-disable-next-line no-empty
          try {
            await this.Corp.hireEmployee(this.data.m_division, cities[0]);
            this.hired = true;
            await ns.asleep(4);
          } catch { }
        }

        for (let i = 1; i < cities.length; i++) {
          while (
            this.Corp.getCorporation().funds / 2 >
            this.Corp.getOfficeSizeUpgradeCost(this.data.m_division, cities[i], 3) &&
            this.Corp.getOffice(this.data.m_division, cities[i]).size <
            this.Corp.getOffice(this.data.m_division, cities[0]).size -
            Math.min(Math.floor(this.Corp.getOffice(this.data.m_division, cities[i]).size * 0.7), 60)
          ) {
            await this.Corp.upgradeOfficeSize(this.data.m_division, cities[i], 3);
          }
          // eslint-disable-next-line no-empty
          while (
            this.Corp.getOffice(this.data.m_division, cities[i]).employees <
            this.Corp.getOffice(this.data.m_division, cities[i]).size
          ) {
            try {
              await this.Corp.hireEmployee(this.data.m_division, cities[i]);
              this.hired = true;
            } catch { }
          }
        }

        if (this.hired) {
          await this.Assign(1, this.data.EmployeeRatio);
        }
        max = this.Corp.getCorporation().funds / 2;

        for (let i = 0; i < 100; i++) {
          for (let upgrade of upgrades) {
            if (
              this.Corp.getCorporation().funds > this.Corp.getUpgradeLevelCost(upgrade) &&
              this.Corp.getCorporation().funds > max
            ) {
              await this.Corp.levelUpgrade(upgrade);
            }
          }
        }
        if (
          this.Corp.getDivision(this.data.m_division).research > 5000 &&
          !this.Corp.hasResearched(this.data.m_division, 'Hi-Tech R&D Laboratory')
        ) {
          this.Corp.research(this.data.m_division, 'Hi-Tech R&D Laboratory');
        }

        if (this.Corp.getDivision(this.data.m_division).research > 300000 && a_research.length > 0) {
          for (let i = 0; i < a_research.length; i++) {
            const t_research = a_research.shift();

            if (!this.Corp.hasResearched(this.data.m_division, t_research)) {
              if (
                this.Corp.getDivision(this.data.m_division).research >
                this.Corp.getResearchCost(this.data.m_division, t_research)
              ) {
                this.Corp.research(this.data.m_division, t_research);
              } else {
                a_research.push(t_research);
              }
            }
          }
        } else if (this.Corp.getDivision(this.data.m_division).research > 500000 && b_research.length > 0) {
          for (let i = 0; i < b_research.length; i++) {
            const t_research = b_research.shift();

            if (!this.Corp.hasResearched(this.data.m_division, t_research)) {
              if (
                this.Corp.getDivision(this.data.m_division).research >
                this.Corp.getResearchCost(this.data.m_division, t_research)
              ) {
                this.Corp.research(this.data.m_division, t_research);
              } else {
                b_research.push(t_research);
              }
            }
          }
        }
      }
    }
    async Party() {
      this.ns.print('PARTY!!!');
      if (this.data.mode === 'fraud') {
        for (const division of this.Corp.getCorporation().divisions) {
          if (this.data.mode == 'product' && this.data.m_division == division) {
            continue;
          }
          let k;
          if (this.Round >= 2) {
            k = 1;
          } else {
            k = 0;
          }
          for (let city of cities) {
            this.Corp.setAutoJobAssignment(division, city, 'Business', 0);
            this.Corp.setAutoJobAssignment(division, city, 'Operations', 0);
            this.Corp.setAutoJobAssignment(division, city, 'Engineer', 0);
            this.Corp.setAutoJobAssignment(division, city, 'Management', 0);
            this.Corp.setAutoJobAssignment(division, city, 'Research & Development', 0);

            this.Corp.setAutoJobAssignment(division, city, 'Business', k);
            this.Corp.setAutoJobAssignment(division, city, 'Operations', k);
            this.Corp.setAutoJobAssignment(division, city, 'Engineer', k);
            this.Corp.setAutoJobAssignment(division, city, 'Management', k);
            this.Corp.setAutoJobAssignment(division, city, 'Research & Development', this.Corp.getOffice(division, city).employees - k * 4);
          }
        }
      }
      // eslint-disable-next-line no-constant-condition
      while (true) {
        let done = true;
        for (const division of this.Corp.getCorporation().divisions) {
          if (this.data.mode == 'product' && this.data.m_division != division) {
            continue;
          }
          let d_mor = 100;
          let d_ene = 100;
          let d_hap = 100;
          for (let city of cities) {
            let party = 3e6 * (this.Round + 1);
            this.Corp.getOffice(division, city).avgMor > 99 && this.Corp.getOffice(division, city).avgHap > 99
              ? (party = 1e5)
              : null;
            this.Corp.getOffice(division, city).avgMor < 100 || this.Corp.getOffice(division, city).avgHap < 100
              ? this.Corp.throwParty(division, city, party)
              : null;
            this.Corp.getOffice(division, city).avgEne < 100 ? this.Corp.buyCoffee(division, city) : null;

            d_mor = Math.min(d_mor, this.Corp.getOffice(division, city).avgMor);
            d_ene = Math.min(d_ene, this.Corp.getOffice(division, city).avgEne);
            d_hap = Math.min(d_hap, this.Corp.getOffice(division, city).avgHap);
          }
          Math.min(d_mor, d_ene, d_hap) < 99.5 ? (done = false) : null;
        }
        if (done) {
          break;
        }
        if (!done && this.data.mode == 'product') {
          return;
        }

        await this.WaitState('START', 1, true);
      }
      this.hired = false;
    }
    async Assign(index, weight = 1) {
      await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Operations', 0);
      await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Engineer', 0);
      await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Business', 0);
      await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Management', 0);
      await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Research & Development', 0);

      if (index == 1) {
        let mult = Math.ceil(this.Corp.getOffice(this.data.m_division, cities[0]).employees / 1000);
        let engi = Math.ceil(56 * mult * weight);
        let mng = Math.floor(44 * mult * weight);
        while (engi + mng > this.Corp.getOffice(this.data.m_division, cities[0]).employees) mng *= 0.9
        let rnd = this.Corp.getOffice(this.data.m_division, cities[0]).employees - engi - mng - 2;
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Operations', 1);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Engineer', engi);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Business', 1);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Management', mng);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Research & Development', rnd);
      } else if (index == 2) {
        let engi = this.Corp.getOffice(this.data.m_division, cities[0]).employees / 3;
        let mng = engi;
        let rnd = mng - 2;
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Operations', 1);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Engineer', engi);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Business', 1);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Management', mng);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Research & Development', rnd);
      } else if (index == 3) {
        let engi = this.Corp.getOffice(this.data.m_division, cities[0]).employees / 3;
        let mng = engi;
        let bus = mng - 1;
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Operations', 1);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Engineer', engi);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Business', bus);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Management', mng);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[0], 'Research & Development', 0);
      }

      for (let i = 1; i < cities.length; i++) {
        if (cities[i] === 'Aevum') {
          continue;
        }
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[i], 'Operations', 0);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[i], 'Engineer', 0);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[i], 'Business', 0);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[i], 'Management', 0);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[i], 'Research & Development', 0);

        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[i], 'Operations', 1);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[i], 'Engineer', 1);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[i], 'Business', 1);
        await this.Corp.setAutoJobAssignment(this.data.m_division, cities[i], 'Management', 1);
        await this.Corp.setAutoJobAssignment(
          this.data.m_division,
          cities[i],
          'Research & Development',
          this.Corp.getOffice(this.data.m_division, cities[i]).employees - 4,
        );
      }
    }
    async WaitTA2() {

      while (!this.TA2) {
        if (this.products.length === 0) {
          await ns.asleep(100);
        }
        while (this.Corp.getDivision(this.data.m_division).research < 70000) { await ns.asleep(200) }
        if (this.products[0].prog >= 100 && this.Corp.getDivision(this.data.m_division).research) {
          this.Corp.research(this.data.m_division, 'Market-TA.I');
          this.Corp.research(this.data.m_division, 'Market-TA.II');
          this.TA2 = true

        }
        await ns.asleep(100);
      }
    }
    async ProductLoop() {
      if (!this.temp) {
        this.temp = true;
        this.WaitTA2();
      }
      let max = 3;
      this.Corp.hasResearched(this.data.m_division, 'uPgrade: Capacity.II')
        ? (max = 5)
        : this.Corp.hasResearched(this.data.m_division, 'uPgrade: Capacity.I')
          ? (max = 4)
          : (max = 3);
      this.TA2 = this.Corp.hasResearched(this.data.m_division, 'Market-TA.II');
      if (this.products.length != this.Corp.getDivision(this.data.m_division).products.length) {
        for (let i = 0; i < this.products.length; i++) {
          this.products.shift();
        }

        for (let i = 0; i < this.Corp.getDivision(this.data.m_division).products.length; i++) {
          let t_product = this.Corp.getProduct(
            this.data.m_division,
            this.Corp.getDivision(this.data.m_division).products[i],
          );
          this.products.push({
            name: t_product.name,
            prog: t_product.developmentProgress,
            max: this.data.productMin,
            min: this.data.productMin,
            invest: this.data.invest,
            time: 0,
          });
        }
      }
      if (this.products.length == 0) {
        let invest = Math.max(this.Corp.getCorporation().funds * 0.1, 100000000);
        await this.Corp.makeProduct(this.data.m_division, cities[0], 0, invest, invest);
        await this.Corp.makeProduct(this.data.m_division, cities[0], 1, invest, invest);
        this.products.push({
          name: 0,
          prog: 0,
          max: this.data.productMin,
          min: this.data.productMin,
          invest: invest,
          time: 0,
        });
        this.products.push({
          name: 1,
          prog: 0,
          max: this.data.productMin,
          min: this.data.productMin,
          invest: invest,
          time: 0,
        });
      }

      let currProduct = this.products.find((x) => x.prog < 100);

      if (this.products.length == max && currProduct == undefined) {
        this.Corp.discontinueProduct(this.data.m_division, this.products[0].name);
        this.products.shift();
      }
      if (this.products.length < max) {
        const oldProduct = this.products[this.products.length - 1];
        const invest = this.Corp.getCorporation().funds * 0.1;
        const name = parseInt(oldProduct.name) + 1;
        this.Corp.makeProduct(this.data.m_division, cities[0], name, invest, invest);
        this.products.push({
          name: name,
          prog: 0,
          max: this.data.productMin,
          min: this.productMin,
          invest: invest,
          time: 0,
        });
        currProduct == undefined ? (currProduct = this.products[this.products.length - 1]) : null;
      }

      for (let i = 0; i < this.products.length; i++) {
        const tmpProg = this.Corp.getProduct(this.data.m_division, this.products[i].name);
        const qty = tmpProg.cityData[cities[0]][0];
        const prod = tmpProg.cityData[cities[0]][1];
        const sell = tmpProg.cityData[cities[0]][2];
        this.products[i].prog = tmpProg.developmentProgress;
        if (this.products[i].prog < 100) {
          if (this.products[i].time < 1 && this.products[i].time !== 0) {
            this.products[i].time =
              performance.now() +
              ((1 - this.products[i].prog) / (this.products[i].prog - this.products[i].time)) * 1000;
          } else if (this.products[i].time >= performance.now()) {
            this.products[i].time = this.products[i].prog;
          }
        } else {
          if (!this.TA2) {
            this.Corp.sellProduct(this.data.m_division, cities[0], this.products[i].name, 'MAX', 'MP', true);
          } else {
            //change for TA2 changes
            this.Corp.sellProduct(this.data.m_division, cities[0], this.products[i].name, 'MAX', 'MP', true);
            this.Corp.setProductMarketTA2(this.data.m_division, this.products[i].name, true);

          }
        }
      }
    }
    /** @param {import("../").NS} ns */
    async TakeOffer() {
      this.ns.print('Taking Offer *.*');

      while (
        this.Round == 1 &&
        this.Corp.getCorporation().funds - this.Corp.getUpgradeLevelCost('Smart Storage') >
        this.Corp.getIndustryData(all_divisions[this.Corp.getCorporation().divisions.length]).startingCost
      ) {
        await this.Corp.levelUpgrade('Smart Storage');
      }
      while (
        this.Round == 2 &&
        this.Corp.getCorporation().funds - this.Corp.getUpgradeLevelCost('Smart Storage') > 1e12
      ) {
        await this.Corp.levelUpgrade('Smart Storage');
      }
      if (this.Round == 3) {
        // eslint-disable-next-line no-empty
        for (let i = 0; i < this.products.length; i++) {
          if (this.products[i].prog < 100) {
            continue;
          }
          this.Corp.hasResearched(this.data.m_division, 'Market-TA.II')
            ? this.Corp.setProductMarketTA2(this.data.m_division, this.products[i].name, false)
            : null;
          this.Corp.sellProduct(this.data.m_division, cities[0], this.products[i].name, 'MAX', 'MP', true);
          this.Corp.hasResearched(this.data.m_division, 'Market-TA.II')
            ? this.Corp.setProductMarketTA2(this.data.m_division, this.products[i].name, true)
            : null;
        }
      }
      for (const division of this.Corp.getCorporation().divisions) {
        if (this.Round == 3 && division == this.data.m_division && this.data.mode == 'product') {
          continue;
        }
        for (const city of cities) {
          this.Corp.sellMaterial(division, city, this.data.prodMat, 0, 'MP');
          const freeSpace = 5;
          const amt =
            (this.Corp.getWarehouse(division, city).size -
              this.Corp.getWarehouse(division, city).sizeUsed -
              freeSpace) *
            this.data.prodMatSize;
          this.Corp.buyMaterial(division, city, this.data.prodMat, amt);
          await this.Corp.setAutoJobAssignment(division, city, 'Business', 0);
          await this.Corp.setAutoJobAssignment(division, city, 'Operations', 0);
          await this.Corp.setAutoJobAssignment(division, city, 'Engineer', 0);
          await this.Corp.setAutoJobAssignment(division, city, 'Management', 0);
          await this.Corp.setAutoJobAssignment(division, city, 'Research & Development', 0);
          await this.Corp.setAutoJobAssignment(
            division,
            city,
            'Engineer',
            this.Corp.getOffice(division, city).employees,
          );
        }
      }
      //wait for stock
      await this.WaitState('PURCHASE', 1, true);
      //reset buys to 0
      for (const division of this.Corp.getCorporation().divisions) {
        for (let city of cities) {
          this.Corp.buyMaterial(division, city, this.data.prodMat, 0);
        }
      }
      //set employees for fraud
      for (const division of this.Corp.getCorporation().divisions) {
        if (this.Round == 3 && division == this.data.m_division && this.data.mode == 'product') {
          await this.Assign(3, 2);
          continue;
        }
        for (let city of cities) {
          await this.Corp.setAutoJobAssignment(division, city, 'Research & Development', 0);
          await this.Corp.setAutoJobAssignment(division, city, 'Operations', 0);
          await this.Corp.setAutoJobAssignment(division, city, 'Engineer', 0);
          await this.Corp.setAutoJobAssignment(division, city, 'Management', 0);
          await this.Corp.setAutoJobAssignment(
            division,
            city,
            'Business',
            this.Corp.getOffice(division, city).employees,
          );
        }
      }
      await this.WaitState('START');
      for (const division of this.Corp.getCorporation().divisions) {
        if (this.Round == 3 && division == this.data.m_division && this.data.mode == 'product') {
          await this.Assign(3, 2);
          continue;
        }
        for (const city of cities) {
          this.Corp.sellMaterial(division, city, this.data.prodMat, 'MAX', 'MP');
        }
      }
      if (
        this.Corp.getCorporation().divisions.length < 14 &&
        this.Corp.getCorporation().funds >
        this.Corp.getIndustryData(all_divisions[this.Corp.getCorporation().divisions.length]).startingCost
      ) {
        this.Corp.expandIndustry(
          all_divisions[this.Corp.getCorporation().divisions.length],
          all_divisions[this.Corp.getCorporation().divisions.length],
        );
      }

      if (this.data.mode == 'product') {
        for (let i = 0; i < 5; i++) {
          await this.WaitState('START', 1, true);
          await this.Prep();
        }
      } else {
        await this.WaitState('START', 5, true);
      }

      this.offers.push(this.Corp.getInvestmentOffer().funds);
      this.Corp.acceptInvestmentOffer();
      this.Round += 1;
      this.times.push(this.ns.getPlayer().playtimeSinceLastBitnode - this.start);
      this.Analyze(0);
      this.Round === 4 ? this.GoPublic() : null;
    }
    GoPublic() {
      this.Corp.goPublic(0);
      this.Corp.issueDividends(0.01);
      for (const unlock of this.Corp.getConstants().unlockNames) {
        if (this.Corp.hasUnlockUpgrade(unlock)) continue;
        this.Corp.unlockUpgrade(unlock);
      }
    }

    async CreateCorp() {
      if (!this.ns.getPlayer().hasCorporation) {
        const name = Math.random().toString(16).slice(2);
        if (this.ns.getPlayer().bitNodeN == 3) {
          this.Corp.createCorporation(name, false);
        } else {
          while (this.ns.getPlayer().money < 15e10) {
            this.ns.clearLog();
            this.ns.print('Waiting for Money to create Corp');
            await this.ns.asleep(30 * 1000);
          }
          this.Corp.createCorporation(name, true);
        }
        this.dataSet = ValData.find((data) => VALUATION >= data.Val).data;
        this.start = this.ns.getPlayer().playtimeSinceLastBitnode;
        this.ns.write(
          CORP_FILE,
          JSON.stringify({ name: name, dataSet: this.dataSet, start: this.start, Val: VALUATION }),
          'w',
        );
      } else {
        const read = JSON.parse(this.ns.read(CORP_FILE));
        this.dataSet = read.dataSet;
        this.start = read.start;
      }
    }

    async CheckGoals() {
      while (!this.Goal_100) {
        if (this.products.length > 0 && !this.firstproduct) {
          if (this.products[0].prog >= 100) {
            this.Analyze(2);
            this.firstproduct = true;
          }
        }
        if (this.Corp.getCorporation().funds >= 1e30 && !this.Goal_30) {
          this.Analyze(3);
          this.Goal_30 = true;
        }
        if (this.Corp.getCorporation().funds >= 1e70 && !this.Goal_70) {
          this.Analyze(4);
          this.Goal_70 = true;
        }
        if (this.Corp.getCorporation().funds >= 1e100 && !this.Goal_100) {
          this.Analyze(5);
          this.Goal_100 = true;
        }
        await this.ns.asleep(200);
      }
    }

    //from https://github.com/alainbryden/bitburner-scripts/blob/main/helpers.js
    FormatMoney(num, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
      let numberShort = this.formatNumberShort(num, maxSignificantFigures, maxDecimalPlaces);
      return num >= 0 ? '$' + numberShort : numberShort.replace('-', '-$');
    }
    formatNumberShort(num, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
      const symbols = ['', 'k', 'm', 'b', 't', 'q', 'Q', 's', 'S', 'o', 'n', 'e33', 'e36', 'e39'];
      if (Math.abs(num) > 10 ** (3 * symbols.length))
        // If we've exceeded our max symbol, switch to exponential notation
        return num.toExponential(Math.min(maxDecimalPlaces, maxSignificantFigures - 1));
      for (var i = 0, sign = Math.sign(num), num = Math.abs(num); num >= 1000 && i < symbols.length; i++) num /= 1000;
      // TODO: A number like 9.999 once rounded to show 3 sig figs, will become 10.00, which is now 4 sig figs.
      return (
        (sign < 0 ? '-' : '') +
        num.toFixed(Math.max(0, Math.min(maxDecimalPlaces, maxSignificantFigures - Math.floor(1 + Math.log10(num))))) +
        symbols[i]
      );
    }
    async Analyze(mode) {
      if (this.start == undefined) {
        this.ns.tprint('Start unknown wont log');
        return;
      }
      const end = this.ns.getPlayer().playtimeSinceLastBitnode;
      const runtime = this.ns.tFormat(end - this.start);
      let result;
      switch (mode) {
        case 0:
          result =
            this.Round +
            ': ' +
            this.FormatMoney(this.offers.at(-1), 3, 1) +
            ' after ' +
            this.ns.tFormat(this.times.at(-1));
          this.Round == 1
            ? this.ns.write(analyzefile, '\n' + result, 'a')
            : this.ns.write(analyzefile, ' ' + result, 'a');
          this.ns.tprint(result);
          await this.ns.asleep(21)
          break;
        case 1:
          result = 'Public after: ' + runtime;
          this.ns.write(analyzefile, ' ' + result, 'a');
          this.ns.tprint(result);
          break;
        case 2:
          result = 'First Product at: ' + runtime;
          this.ns.write(analyzefile, ' ' + result, 'a');
          this.ns.tprint(result);
          break;
        case 3:
          result = 'e30 : ' + runtime;
          this.ns.write(analyzefile, ' ' + result, 'a');
          this.ns.tprint(result);
          break;
        case 4:
          result = 'e70 : ' + runtime;
          this.ns.write(analyzefile, ' ' + result, 'a');
          this.ns.tprint(result);
          break;
        case 5:
          result = 'e100 : ' + runtime;
          this.ns.write(analyzefile, ' ' + result, 'a');
          this.ns.tprint(result);
          break;
        default:
          this.ExitError('No Mode Set?');
          break;
      }
    }
  }

  let corp = new Corp(ns);
  await corp.Main(ns);
}

/** @param {import("../").NS} ns */
async function CheckSFandVal(ns) {
  //check for required Source Files
  const SF = ns.singularity.getOwnedSourceFiles();
  const PLAYER = ns.getPlayer();
  const BN3 = SF.find((BN) => BN.n === 3);
  if ((PLAYER.bitNodeN !== 3 && !BN3) || BN3.lvl !== 3) {
    DoublePrint(ns, 'You need SF 3.3 for this Script. Exiting...');
    ns.exit();
  }
  if (SF.some((BN) => BN.n === 5)) {
    return ns.getBitNodeMultipliers().CorporationValuation;
  }
  if (ns.corporation.hasCorporation()) {
    if (ns.read(CORP_FILE).name !== ns.corporation.getCorporation().name) {
      DoublePrint(
        ns,
        'You got a Corp wich is not from this Script or you removed the Corp File, cant validate your State. Exiting...',
      );
    }
    return ns.read(CORP_FILE).Val;
  }
  return await GetVal(ns);
}
/** @param {import("../").NS} ns */
async function GetVal(ns) {
  const BN = await ns.prompt('Wich Bn are we in?', {
    type: 'select',
    choices: Array(13)
      .fill(1)
      .map((bn, i) => i + 1),
  });
  if (BN === '12') {
    const subBN = await ns.prompt('Wich Level of BN 12 are we in?', { type: 'text' });
    if (!IsPositiveInt(subBN)) {
      DoublePrint(ns, 'Invalid Input for BN 12 Level. Exiting and restarting in 10 seconds');
      ns.spawn(ns.getScriptName());
    }
    return 1 / Math.pow(1.02, Number(subBN));
  } else if (BN === '8') {
    DoublePrint(ns, 'Corps are disabled in BN 8. Good Luck, Have Fun & Byeeee');
    ns.exit();
  } else {
    return BnValData[BN];
  }
}
function IsPositiveInt(str) {
  return /^\+?[1-9]\d*$/.test(str);
}
function DoublePrint(ns, text) {
  ns.tprint(text);
  ns.print(text);
}
