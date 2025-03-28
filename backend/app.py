from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
import os
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import os

load_dotenv()


# Download and cache the model
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

print("Model downloaded successfully!")

app = Flask(__name__)
CORS(app)  # Allow requests from React Native 

# ✅ Load LLaMA-3 from Groq API
def initialize_llm():
    groq_api_key = os.getenv("GROQ_API_KEY")
    return ChatGroq(
        temperature=0,
        groq_api_key=groq_api_key,
        model_name="llama-3.3-70b-versatile"
    )

llm = initialize_llm()

# ✅ Load ChromaDB
db_path = "./chroma_db"
embeddings = HuggingFaceBgeEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

if os.path.exists(db_path):
    vector_db = Chroma(persist_directory=db_path, embedding_function=embeddings)
else:
    # 🛠️ Create an empty ChromaDB to avoid NoneType error
    vector_db = Chroma(persist_directory=db_path, embedding_function=embeddings)
    vector_db.persist()  # Ensure the database is saved

retriever = vector_db.as_retriever()

# ✅ Setup the QA Chain with Concise Responses
prompt_template = """You are a mental health chatbot named Calmify. Keep your answers short and supportive:
{context}
User: {question}
Chatbot: """
PROMPT = PromptTemplate(template=prompt_template, input_variables=['context', 'question'])

if retriever:
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={"prompt": PROMPT}
    )
else:
    qa_chain = None  # Avoid errors if retriever isn't ready


# ✅ API Route for Chatbot
@app.route('/chat', methods=['POST'])
def chat():
    if not qa_chain:
        return jsonify({"error": "ChromaDB is not initialized properly"}), 500

    data = request.json
    user_input = data.get("message", "")

    if not user_input:
        return jsonify({"error": "No message provided"}), 400

    response = qa_chain.run(user_input)
    return jsonify({"response": response})

# ✅ Run Flask Server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
