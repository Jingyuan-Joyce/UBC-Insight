"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chai_1 = require("chai");
const fs = require("fs-extra");
const chaiAsPromised = require("chai-as-promised");
const IInsightFacade_1 = require("../src/controller/IInsightFacade");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const Util_1 = require("../src/Util");
const TestUtil_1 = require("./TestUtil");
describe("InsightFacade Add/Remove/List Dataset", function () {
    const datasetsToLoad = {
        "courses": "./test/data/courses.zip",
        "course_4": "./test/data/courses.zip",
        " ": "./test/data/courses.zip",
        "course1": "./test/data/course1.txt",
        "course2": "./test/data/course2.zip",
        "course3": "./test/data/course3.zip",
        "course4": "./test/data/course4.zip",
        "course5": "./test/data/course5.zip",
    };
    let datasets = {};
    let insightFacade;
    const cacheDir = __dirname + "/../data";
    before(function () {
        Util_1.default.test(`Before all`);
        chai.use(chaiAsPromised);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
        try {
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    it("Should add a valid dataset", function () {
        const id = "courses";
        const expected = [id];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Unable add: kind is null", function () {
        const id = "courses";
        return insightFacade.addDataset(id, datasets[id], null).catch((error) => {
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError, "Add fail: kind is null");
        });
    });
    it("Unable add: id is null", function () {
        const id = null;
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).catch((error) => {
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError, "Add fail: id is null");
        });
    });
    it("Unable add: invalid id containing underscore", function () {
        const id = "course_4";
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).catch((error) => {
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError, "Add fail: invalid id containing underscore");
        });
    });
    it("Unable add: invalid id only whitespace character", function () {
        const id = " ";
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).catch((error) => {
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError, "Add fail: id containing only whitespace character");
        });
    });
    it("add an invalid dataset: not a zip file", function () {
        const id = "course1";
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).catch((error) => {
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError, "add an invalid dataset: not a zip file");
        });
    });
    it("add an invalid dataset: the zip file is empty", function () {
        const id = "course2";
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).catch((error) => {
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError, "add an invalid dataset: the zip file is empty");
        });
    });
    it("add an invalid dataset: not under the course folder", function () {
        const id = "course3";
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).catch((error) => {
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError, "add invalid dataset: not in course folder");
        });
    });
    it("add an invalid dataset: empty JSON course file", function () {
        const id = "course4";
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).catch((error) => {
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError, "add an invalid dataset: empty JSON course file");
        });
    });
    it("add an invalid dataset: incorrect JSON course file", function () {
        const id = "course5";
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).catch((error) => {
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError, "add invalid dataset: incorrect file");
        });
    });
    it("add an invalid dataset: duplicate id dataset", function () {
        const id = "courses";
        const expected = [id];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected).then((error) => {
            insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError);
        });
    });
    it("Successful remove: remove a valid dataset that has been added", function () {
        const id = "courses";
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).then(() => {
            return insightFacade.removeDataset(id).then((futureResult) => {
                return chai_1.expect(futureResult).to.be.equal(id);
            });
        });
    });
    it("Not able to remove dataset that has not been added", function () {
        const id = "course6";
        return insightFacade.removeDataset(id).catch((error) => {
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.NotFoundError);
        });
    });
    it("Unable remove: invalid id containing underscore", function () {
        const id = "courses";
        const expected = [id];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected).then((error) => {
            const id2 = "courses_";
            insightFacade.removeDataset(id2);
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError, "Remove fail: invalid id containing underscore");
        });
    });
    it("Unable remove: invalid id with only whitespace character", function () {
        const id = "courses";
        const expected = [id];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected).then((error) => {
            const id2 = " ";
            insightFacade.removeDataset(id2);
            return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError, "Remove fail: only whitespace character id");
        });
    });
    it("Remove same data set twice", function () {
        const id = "courses";
        const expected = [id];
        return insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses).then(() => {
            return insightFacade.removeDataset(id).then((error) => {
                return chai_1.expect(error).to.be.an.instanceOf(IInsightFacade_1.InsightError, "Remove dataset twice");
            });
        });
    });
    it("return one Dataset that has added", function () {
        const dataset = {
            id: "course100",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 55
        };
        return insightFacade.addDataset(dataset.id, datasets[dataset.id], IInsightFacade_1.InsightDatasetKind.Courses).then(() => {
            return insightFacade.listDatasets().then((futureResult) => {
                return chai_1.expect(futureResult).to.eventually.include(dataset);
            });
        });
    });
    it("list two Dataset has added", function () {
        const dataset = {
            id: "course100",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 55
        };
        const dataset2 = {
            id: "course200",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 90
        };
        return insightFacade.addDataset(dataset.id, datasets[dataset.id], IInsightFacade_1.InsightDatasetKind.Courses).then(() => {
            return insightFacade.addDataset(dataset2.id, datasets[dataset2.id], IInsightFacade_1.InsightDatasetKind.Courses).then(() => {
                return insightFacade.listDatasets().then((futureResult) => {
                    return chai_1.expect(futureResult).to.eventually.include({ dataset, dataset2 });
                });
            });
        });
    });
    it("not list the dataset that has not added", function () {
        const dataset = {
            id: "course300",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 26
        };
        const dataset2 = {
            id: "course200",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 90
        };
        return insightFacade.addDataset(dataset.id, datasets[dataset.id], IInsightFacade_1.InsightDatasetKind.Courses).then(() => {
            return insightFacade.listDatasets().then((futureResult) => {
                return chai_1.expect(futureResult).to.eventually.not.include(dataset2);
            });
        });
    });
    it("no dataset in the list", function () {
        return insightFacade.listDatasets().then((futureResult) => {
            return chai_1.expect(futureResult).to.eventually.include(null);
        });
    });
});
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery = {
        courses: {
            path: "./test/data/courses.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
        },
    };
    let insightFacade;
    let testQueries = [];
    before(function () {
        Util_1.default.test(`Before: ${this.test.parent.title}`);
        try {
            testQueries = TestUtil_1.default.readTestQueries();
        }
        catch (err) {
            chai_1.expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }
        const loadDatasetPromises = [];
        insightFacade = new InsightFacade_1.default();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult = insightFacade.performQuery(test.query);
                    return TestUtil_1.default.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map