# SCAI Search Engine

SCAICH is an open-source academic paper search engine, especially made to index the data from Sci-Hub. Sci-Hub is a website that supports free academic paper downloads, while the search engine of Sci-Hub does not support modern schemas like vector-based semantic search.

Our project helps to solve this problem. Besides, we also intend to combine with more open-access databases to provide not only the search link but also the full text of the paper. Additionally, an Ollama-based assistant is integrated into the project.

Have fun and happy writing!

## Before Starting

SCAICH has three core components, which are:

- **Frontend**: A friendly user interface to execute the search command and visualize the result.
- **Backend**: A Flask-based server to handle search and AI composition tasks.
- **Data**: A subset of Sci-Hub paper metadata, which includes papers with citations > 3.

## Backend

Before starting, you shall first ensure you have installed Milvus and recorded all the metadata in vector form. The metadata can be fetched from the release of the GitHub repo.

To install Milvus, we suggest using Docker. We have put `milvus-standalone-docker-compose.yml` in the project root. You can change the filename to `docker-compose.yml` and run the following command to install:

```bash
docker-compose up -d
```

Next, run `scihub_to_milvus.py` to load the metadata into Milvus. We use `nomic-embed-text:latest` and `snowflake-arctic-embed:33m` to embed the text. You should install Ollama first, and run:

```bash
ollama run snowflake-arctic-embed:33m
ollama run nomic-embed-text:latest
```

This ensure the embedding model is successfully installed. Lastly, you can simply run the backend using Python3:

```bash
python3 main.py
```

Therefore, the backend of SCAICH has been fully installed. All the dependencies are in `requirements.txt`.

## Frontend

The frontend is made by React. To install, we suggest using Yarn:

```bash
yarn
yarn run start
```

You must install Node.js before running the frontend.