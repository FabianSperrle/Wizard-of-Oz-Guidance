# Wizards of Guidance: Investigating Guidance Strategiesand Interaction Dynamics in a Double-Blind Wizard of Oz Study

This repository contains the code for the study environment used in the paper "F. Sperrle, D. Ceneda, A. Arleo, M. El-Assady: '_Wizards of Guidance: Investigating Guidance Strategiesand Interaction Dynamics in a Double-Blind Wizard of Oz Study_', submitted & under review."

The project provides a setup for double-blind wizard of oz guidance studies in visual analytics. We provide 

* Logging of user and wizard interactions (incl. mouse position, clicks, and interface interations)
* Synchronization of user's view to the wizard's screen
* Possibility to provide and retract guidance as a wizard
* Possibility to accept/reject and preview guidance as a user
* Support for multiple, parallel study sessions

Frontend and backend communicate via study-session-specific websockets and REST interfaces.

This repository does not contain the dataset and database migration used in the original study for copyright reasons.

# Contributing

We hope, that this repository will be a useful basis for your wizard of oz study in visual analytics! If you have any questions or find bugs/other problems, please contact us or open issues.


## Local Development

There are two ways to start the project locally: docker-only, or docker+node. The latter version provides faster startup times at the cost of more services cluttering your machine.

### Docker-Only

1. Install `docker` (including `docker-compose`) to your machine. 
2. Open a terminal, switch to this directory
3. Run `docker-compose --profile frontend up`. The application is ready once the terminal output says `guidance-frontend | ✔ Compiled successfully.`
4. Open your browser at `http:localhost:4210`. 
5. Any changes you make to files should automatically sync to the docker container and update the respective components in your browser.



### Docker + Local Node.js installation
1. Install `docker` (including `docker-compose`) to your machine.
2. Install `nodejs` (https://nodejs.org/en/) to your machine.
3. Open a terminal, switch to this directory.
4. Run `npm install` to fetch all dependencies needed for the frontend.
5. Run `ng serve` to start the frontend. Verify success by opening your browser at `localhost:4200`.   
6. Run `docker-compose up` 
