import { ExponentialCost, FreeCost, LinearCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { BigNumber } from "./api/BigNumber";
import { theory } from "./api/Theory";
import { Utils } from "./api/Utils";
import {ui} from "./api/ui/UI";

var id = "Cookies";
var name = "idle sugar";
var description = "idler?";
var authors = "Throngjwk";
var version = 1;

var currency;
var c1, c2, prestige;
var c1Exp, c2Exp;

var achievement1, achievement2;
var chapter1, chapter2;

var init = () => {
    currency = theory.createCurrency("S", "S");

    ///////////////////
    // Regular Upgrades

    // c1
    {
        let getDesc = (level) => "c_1=" + getC1(level).toString(0);
        c1 = theory.createUpgrade(0, currency, new FirstFreeCost(new ExponentialCost(15, Math.log2(2))));
        c1.getDescription = (_) => Utils.getMath(getDesc(c1.level));
        c1.getInfo = (amount) => Utils.getMathTo(getDesc(c1.level), getDesc(c1.level + amount));
    }

    // c2
    {
        let getDesc = (level) => "c_2=3^{" + level + "}";
        let getInfo = (level) => "c_2=" + getC2(level).toString(0);
        c2 = theory.createUpgrade(1, currency, new ExponentialCost(5, Math.log2(10)));
        c2.getDescription = (_) => Utils.getMath(getDesc(c2.level));
        c2.getInfo = (amount) => Utils.getMathTo(getInfo(c2.level), getInfo(c2.level + amount));
    }

    // prestige
    {
        prestige = theory.createUpgrade(10000, currency, new FreeCost());
        prestige.getDescription = (_) => "you Menu";
        prestige.getInfo = (amount) => "you Menu";
        prestige.boughtOrRefunded = (_) => {
            getMenuPopup.show();
            prestige.level = 0;
        }
    }


    /////////////////////
    // Permanent Upgrades
    theory.createPublicationUpgrade(0, currency, 1e10);
    theory.createBuyAllUpgrade(1, currency, 1e13);
    theory.createAutoBuyerUpgrade(2, currency, 1e30);

    ///////////////////////
    //// Milestone Upgrades
    theory.setMilestoneCost(new LinearCost(25, 25));

    {
        c1Exp = theory.createMilestoneUpgrade(0, 3);
        c1Exp.description = Localization.getUpgradeIncCustomExpDesc("c_1", "0.05");
        c1Exp.info = Localization.getUpgradeIncCustomExpInfo("c_1", "0.05");
        c1Exp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
    }

    {
        c2Exp = theory.createMilestoneUpgrade(1, 3);
        c2Exp.description = Localization.getUpgradeIncCustomExpDesc("c_2", "0.05");
        c2Exp.info = Localization.getUpgradeIncCustomExpInfo("c_2", "0.05");
        c2Exp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
    }
    
    /////////////////
    //// Achievements
    achievement1 = theory.createAchievement(0, "Achievement 1", "Description 1", () => c1.level > 1);
    achievement2 = theory.createSecretAchievement(1, "Achievement 2", "Description 2", "Maybe you should buy two levels of c2?", () => c2.level > 1);

    ///////////////////
    //// Story chapters
    chapter1 = theory.createStoryChapter(0, "My First Chapter", "This is line 1,\nand this is line 2.\n\nNice.", () => c1.level > 0);
    chapter2 = theory.createStoryChapter(1, "My Second Chapter", "This is line 1 again,\nand this is line 2... again.\n\nNice again.", () => c2.level > 0);

    var getMenuPopup = ui.createPopup({
        title: "Main Menu",
        content: ui.createStackLayout({
            children: [
                ui.createFrame({
                    heightRequest: 309,
                    cornerRadius: 0,
                    content: ui.createLabel({text: "im this playing.",
                        padding: Thickness(12, 2, 12, 2),
                        fontSize: 15
                    })
                }),
                ui.createLabel({
                    text: "Throngjwk im make a games!",
                    horizontalTextAlignment: TextAlignment.CENTER,
                    fontAttributes: FontAttributes.BOLD,
                    fontSize: 18,
                    padding: Thickness(0, 18, 0, 18),
                }),
                ui.createButton({text: "Close", onClicked: () => getMenuPopup.hide()}),
                ui.createButton({text: "Changelog", onClicked: () => getChangelogPopup.show()}),
                ui.createButton({text: "Coming soon."}),
            ]
        })
    });

    var getChangelogPopup = ui.createPopup({
        title: "Changelog",
        content: ui.createStackLayout({
            children: [
                ui.createFrame({
                    heightRequest: 309,
                    cornerRadius: 0,
                    content: ui.createLabel({text: "v1.0.0: \nRelease!",
                        padding: Thickness(12, 2, 12, 2),
                        fontSize: 25
                    })
                }),
                ui.createLabel({
                    text: "This Changelog this other days.",
                    horizontalTextAlignment: TextAlignment.CENTER,
                    fontAttributes: FontAttributes.BOLD,
                    fontSize: 18,
                    padding: Thickness(0, 18, 0, 18),
                }),
                ui.createButton({text: "Close", onClicked: () => getChangelogPopup.hide()})
            ]
        })
    });
    
    

    updateAvailability();
}

var updateAvailability = () => {
    c2Exp.isAvailable = c1Exp.level > 0;
}

var tick = (elapsedTime, multiplier) => {
    let dt = BigNumber.from(elapsedTime * multiplier);
    let bonus = theory.publicationMultiplier;
    currency.value += dt * bonus * getC1(c1.level) *
                                   getC2(c2.level);
}

var getPrimaryEquation = () => {
    let result = "\\dot{\\rho} = c_1";

    if (c1Exp.level == 1) result += "^{1.05}";
    if (c1Exp.level == 2) result += "^{1.1}";
    if (c1Exp.level == 3) result += "^{1.15}";

    result += "c_2";

    if (c2Exp.level == 1) result += "^{1.05}";
    if (c2Exp.level == 2) result += "^{1.1}";
    if (c2Exp.level == 3) result += "^{1.15}";

    return result;
}

var getSecondaryEquation = () => theory.latexSymbol + "=\\max\\rho";
var getPublicationMultiplier = (tau) => tau.pow(0.166) / BigNumber.TWO;
var getPublicationMultiplierFormula = (symbol) => "\\frac{{" + symbol + "}^{0.166}}{2}";
var getTau = () => currency.value;
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();

var getC1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getC2 = (level) => BigNumber.THREE.pow(level);
var getC1Exponent = (level) => BigNumber.from(1 + 0.05 * level);
var getC2Exponent = (level) => BigNumber.from(1 + 0.05 * level);

init();
