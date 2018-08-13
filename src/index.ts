import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import { MongoClient, Db, Collection, ObjectID } from 'mongodb';
import { ANIMAL_TYPE } from './animal-type';

const MONGO_URL: string = "mongodb://localhost:27017";
const MONGO_DB: string  = "poc_test"

//App represents the server
class App {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.config();
    }

    private config(): void {
        this.app.use(cors())
    }
}

async function main() {
    const connection: MongoClient = await MongoClient.connect(MONGO_URL);
    const db: Db = connection.db(MONGO_DB)
    const animals: Collection = db.collection('animals');
    const resolvers = {
        Query: {
            animal: async(root: any, {_id}: {_id: string}) => {
                return (await animals.findOne({"_id": new ObjectID(_id)}))
            },
            animals: async () => {
                return (await animals.find({}).toArray())
            },
            animalsByNoise: async (root: any, {noise}: {noise: string}) => {
                return (await animals.find({"noise": noise}).toArray())
            }
        },
    }
    const typeDefs = `
        ${ANIMAL_TYPE}

        type Query {
            animal(_id: String!): Animal
            animals: [Animal]
            animalsByNoise(noise: String!): [Animal]
        }

        schema {
            query: Query
        }
    `

    const schema = makeExecutableSchema({
        typeDefs: typeDefs,
        resolvers: resolvers
    });

    //initialize server
    const server = new App()

    //define routes
    server.app.use(
        '/graphql',
        bodyParser.json(),
        graphqlExpress({schema})
    );

    server.app.use(
        '/graphiql',
        graphiqlExpress({
            endpointURL: '/graphql'
        })
    );

    server.app.listen(3000, () => {
        console.log(`server running on http://localhost:3000/graphiql`)
    })
}

main();