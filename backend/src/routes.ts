import {User} from "./db/entities/User.js";
import { FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {ICreateUserBody} from "./types.js";
import {Match} from "./db/entities/Match.js";


async function DoggrRoutes(app: FastifyInstance, _options = {}) {
	if (!app) {
		throw new Error("Fastify instance has no value during route construction");
	}

	app.get("/hello", async(_req: FastifyRequest, _reply: FastifyReply) => {
		return 'hello';
	});

	app.get("/hello2", async(_req, _reply) => {
		return 'hello2';
	});

	app.get("/dbTest", async (req, _reply) => {
		return req.em.find(User, {});
	});


	app.post<{
		Body: ICreateUserBody
	}>("/users", async (req, reply) => {
		// Fish data out of request (auto converts from json)
		const {name, email, petType} = req.body;

		try {
			// Get our manager from the plugin we wrote
			const newUser = await req.em.create(User, {
				name,
				email,
				petType
			});

			// This will immediately update the real database.  You can store up several changes and flush only once
			// NOTE THE AWAIT -- do not forget it or weirdness abounds
			await req.em.flush();

			console.log("Created new user:", newUser);
			return reply.send(newUser);
		} catch (err) {
			console.log("Failed to create new user: ", err.message);
			return reply.status(500).send({ message: err.message});
		}
	});

	app.search("/users", async (req, reply) => {
		const {email} = req.body;

		try {
			const theUser = await req.em.findOne(User, {email});
			console.log(theUser);
			reply.send(theUser);
		} catch (err) {
			console.error(err);
			reply.status(500)
				.send(err);
		}
	});

	//update
	app.put<{
		Body: ICreateUserBody
	}>("/users", async(req, reply) => {
		const {email, name, petType} = req.body;

		const userToChange = await req.em.findOne(User, {email});
		userToChange.name = name;
		userToChange.petType = petType;

		await req.em.flush();
		console.log(userToChange);
		reply.send(userToChange);

	});

	// DELETE
	app.delete<{ Body: {email}}>("/users", async(req, reply) => {
		const { email } = req.body;

		try {
			const theUser = await req.em.findOne(User, { email });

			await req.em.remove(theUser).flush();
			console.log(theUser);
			reply.send(theUser);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});

	//create match route
	app.post<{Body: { email: string, matchee_email: string }}>("/match", async (req, reply) => {
		const { email, matchee_email } = req.body;

		try {
			const matchee = await req.em.findOne(User, {email: matchee_email});
			const owner = await req.em.findOne(User, {email});

			const newMatch = await req.em.create(Match, {
				owner,
				matchee
			});

			await req.em.flush();

			return reply.send(newMatch);
		} catch (err) {
			console.log(err);
			return reply.status(500).send(err);
		}
	});
}

export default DoggrRoutes;
