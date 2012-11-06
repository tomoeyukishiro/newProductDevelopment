# New Product Development
=====================

Repo for the new product development site. Steps to set up locally:

- Install node
- Clone this repo (link above)
- Install node dependencies by navigating to the file and entering:

```bash
npm install
```

- Run the app by typing

```bash
node app.js
```

## Nodemon

Alternatively, you can run the app in a "watch" mode where it will restart when server logic changes. To do this, install nodemon:

```bash
sudo npm install -g nodemon
nodemon app.js
```

## API endpoints

There are several routes of interest:

 * GET /mobile_home

This is the prompt where you can enter a username to send them a text via twilio

 * POST /text_user  (params: username)

This sends a "please water" text to the specified username, linking to /mobile_water_prompt

 * GET /mobile_water_prompt

Here the user is presented with the button to water the plant, and the plant name (or username) is pre-filled

 * POST /water_plant (params: username)

This will eventually (TODO) water the plant by queueing up a water boolean that the arduino will poll

 * GET /water_plant_after

Here the user sees the confirmation that their plant got watered. We may or may not block based on the arduino actually picking it up

