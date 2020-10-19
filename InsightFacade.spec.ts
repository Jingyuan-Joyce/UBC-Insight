import * as chai from "chai";
import {expect} from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        "courses": "./test/data/courses.zip",
        "course_4": "./test/data/courses.zip",
        " ": "./test/data/courses.zip",
        "course1": "./test/data/course1.txt",
        "course2": "./test/data/course2.zip",
        "course3": "./test/data/course3.zip",
        "course4": "./test/data/course4.zip",
        "course5": "./test/data/course5.zip",

    };

    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
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
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    // This is a unit test. You should create more like this!
    // successful add
    it("Should add a valid dataset", function () {
        const id: string = "courses"; // valid id
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id, // valid id
            datasets[id], // valid dataset
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    // kind is null
    it("Unable add: kind is null", function () {
        const id: string = "courses";
        return insightFacade.addDataset(
            id,
            datasets[id], // valid set
            null,
        ).catch((error) => {
            return expect(error).to.be.an.instanceOf(InsightError, "Add fail: kind is null");
        });
    });

    // 3 invalid id test
    it("Unable add: id is null", function () {
        const id: string = null;
        return insightFacade.addDataset(
            id,
            datasets[id], // valid set
            InsightDatasetKind.Courses,
        ).catch((error) => {
            return expect(error).to.be.an.instanceOf(InsightError, "Add fail: id is null");
        });
    });

    it("Unable add: invalid id containing underscore", function () {
        const id: string = "course_4";
        return insightFacade.addDataset(
            id,
            datasets[id], // valid set
            InsightDatasetKind.Courses,
        ).catch((error) => {
            return expect(error).to.be.an.instanceOf(InsightError, "Add fail: invalid id containing underscore");
        });
    });

    it("Unable add: invalid id only whitespace character", function () {
        const id: string = " ";
        return insightFacade.addDataset(
            id,
            datasets[id], // valid set
            InsightDatasetKind.Courses,
        ).catch((error) => {
            return expect(error).to.be.an.instanceOf(InsightError, "Add fail: id containing only whitespace character");
        });
    });

   // 5 invalid set
    it("add an invalid dataset: not a zip file", function () {
        const id: string = "course1"; // valid id
        return insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        ).catch((error) => {
            return expect(error).to.be.an.instanceOf(InsightError, "add an invalid dataset: not a zip file");
        });
    });

    it("add an invalid dataset: the zip file is empty", function () {
        const id: string = "course2"; // valid id
        return insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        ).catch((error) => {
            return expect(error).to.be.an.instanceOf(InsightError, "add an invalid dataset: the zip file is empty");
        });
    });

    it("add an invalid dataset: not under the course folder", function () {
        const id: string = "course3"; // valid id
        return insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        ).catch((error) => {
            return expect(error).to.be.an.instanceOf(InsightError, "add invalid dataset: not in course folder");
        });
    });

    it("add an invalid dataset: empty JSON course file", function () {
        const id: string = "course4"; // valid id
        return insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        ).catch((error) => {
            return expect(error).to.be.an.instanceOf(InsightError, "add an invalid dataset: empty JSON course file");
        });
    });

    it("add an invalid dataset: incorrect JSON course file", function () {
        const id: string = "course5"; // valid id
        return insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        ).catch((error) => {
            return expect(error).to.be.an.instanceOf(InsightError, "add invalid dataset: incorrect file");
        });
    });

    // duplicate id dataset
    it("add an invalid dataset: duplicate id dataset", function () {
        const id: string = "courses"; // valid id
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(// call the method addDataset
            id, // valid id
            datasets[id], // valid dataset
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected).then((error) => {
            insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            return expect(error).to.be.an.instanceOf(InsightError);
        });
    });


    // removeDataset

    // successful remove
    it("Successful remove: remove a valid dataset that has been added", function () {
        const id: string = "courses";
        return insightFacade.addDataset( // call the method addDataset
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        ).then(() => {return insightFacade.removeDataset(id).then((futureResult) => {
            return expect(futureResult).to.be.equal(id);
        });
        });
    });

    it("Not able to remove dataset that has not been added", function () {
        const id: string = "course6";
        return insightFacade.removeDataset(id).catch((error) => {
                    return expect(error).to.be.an.instanceOf(NotFoundError);
        });
    });

    // 2 invalid key remove
    it("Unable remove: invalid id containing underscore", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset( // call the method addDataset
            id, // corresponding to the first field
            datasets[id], // the id corresponding course content (string) in datasets, which is nothing here
            InsightDatasetKind.Courses, // course kind
        );
        return expect(futureResult).to.eventually.deep.equal(expected).then((error) => {
            const id2: string = "courses_";
            insightFacade.removeDataset(id2);
            return expect(error).to.be.an.instanceOf(InsightError, "Remove fail: invalid id containing underscore");
        });

    });

    it("Unable remove: invalid id with only whitespace character", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset( // call the method addDataset
            id, // corresponding to the first field
            datasets[id], // the id corresponding course content (string) in datasets, which is nothing here
            InsightDatasetKind.Courses, // course kind
        );
        return expect(futureResult).to.eventually.deep.equal(expected).then((error) => {
            const id2: string = " ";
            insightFacade.removeDataset(id2);
            return expect(error).to.be.an.instanceOf(InsightError, "Remove fail: only whitespace character id");
        });
    });

    // remove same data set twice
    it("Remove same data set twice", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.removeDataset(id).then((error) => {
                return expect(error).to.be.an.instanceOf(InsightError, "Remove dataset twice");
            });
        });
    });


    // test listDataset, init dataset by myself, add to the dataset, then test
    it("return one Dataset that has added", function () {
        const dataset = {
            id: "course100",
            kind: InsightDatasetKind.Courses,
            numRows: 55
        } as InsightDataset; // init data set
        return insightFacade.addDataset(dataset.id, datasets[dataset.id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.listDatasets().then((futureResult) => {
                return expect(futureResult).to.eventually.include(dataset);
            });
        });
    });

    it("list two Dataset has added", function () {
        const dataset = {
            id: "course100",
            kind: InsightDatasetKind.Courses,
            numRows: 55
        } as InsightDataset; // init data set 1
        const dataset2 = {
            id: "course200",
            kind: InsightDatasetKind.Courses,
            numRows: 90
        } as InsightDataset; // init data set 2
        return insightFacade.addDataset(dataset.id, datasets[dataset.id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.addDataset(dataset2.id, datasets[dataset2.id], InsightDatasetKind.Courses).then(() => {
                return insightFacade.listDatasets().then((futureResult) => {
                    return expect(futureResult).to.eventually.include({dataset, dataset2});
                });
            });
        });

    });

    it("not list the dataset that has not added", function () {
        const dataset = {
            id: "course300",
            kind: InsightDatasetKind.Courses,
            numRows: 26
        } as InsightDataset; // init data set
        const dataset2 = {
            id: "course200",
            kind: InsightDatasetKind.Courses,
            numRows: 90
        } as InsightDataset; // init data set 2
        return insightFacade.addDataset(dataset.id, datasets[dataset.id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.listDatasets().then((futureResult) => {
                return expect(futureResult).to.eventually.not.include(dataset2);
            });
        });
    });

    it("no dataset in the list", function () {
        return insightFacade.listDatasets().then((futureResult) => {
             return expect(futureResult).to.eventually.include(null);
         });
    });

});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: {
        [id: string]: { path: string; kind: InsightDatasetKind };
    } = {
        courses: {
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises).catch(() => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * TODO For C1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult: Promise<
                        any[]
                    > = insightFacade.performQuery(test.query);
                    return TestUtil.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
