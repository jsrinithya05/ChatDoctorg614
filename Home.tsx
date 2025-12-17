import React from "react";

function Home({ onStart }) {
  return (
    <div className="min-h-screen bg-pattern flex flex-col text-slate-800">

      {/* Header */}
      <div className="flex justify-between items-center px-10 py-6">
        <h1 className="text-2xl font-bold">ChatDoctor AI</h1>
        <button
          onClick={onStart}
          className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-xl font-semibold"
        >
          Get Started →
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-5xl bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-10 space-y-10">

          {/* WHO WE ARE */}
          <section>
            <h2 className="text-3xl font-bold mb-4">Who We Are</h2>
            <p className="text-slate-700 leading-relaxed">
              ChatDoctor is an advanced AI-powered healthcare platform designed
              to serve as an immediate bridge between medical inquiries and
              expert-level guidance. Developed using sophisticated language
              models and trained on vast datasets of real-world medical
              dialogues, ChatDoctor functions as a 24/7 digital medical
              assistant. It is built to understand the complexities of human
              health and provide a reliable first point of contact for anyone
              seeking health information.
            </p>
          </section>

          {/* WHAT WE DO */}
          <section>
            <h2 className="text-3xl font-bold mb-4">What We Do</h2>
            <ul className="list-disc ml-6 space-y-3 text-slate-700">
              <li>
                <strong>Instant Health Consultation:</strong> ChatDoctor analyzes
                your symptoms and health concerns in real-time, providing
                immediate explanations and potential causes.
              </li>
              <li>
                <strong>Medical Knowledge Navigation:</strong> It translates
                complex medical jargon into easy-to-understand language,
                helping you understand diagnoses, medications, and laboratory
                results.
              </li>
              <li>
                <strong>Specialized Triage:</strong> The platform identifies the
                urgency of your condition and recommends the appropriate
                medical professional or level of care required.
              </li>
            </ul>
          </section>

          {/* WHY CHATDOCTOR */}
          <section>
            <h2 className="text-3xl font-bold mb-4">Why ChatDoctor?</h2>
            <ul className="list-disc ml-6 space-y-3 text-slate-700">
              <li>
                <strong>Always Available:</strong> Medical concerns don't keep
                office hours. ChatDoctor is available 365 days a year,
                providing peace of mind when clinics are closed.
              </li>
              <li>
                <strong>Data-Driven Accuracy:</strong> Unlike a standard search
                engine, ChatDoctor is fine-tuned on professional medical
                interactions and cross-referenced with authoritative clinical
                databases to ensure high-quality outputs.
              </li>
              <li>
                <strong>Complete Privacy:</strong> We prioritize user anonymity.
                Your health inquiries are processed securely, ensuring that
                your personal health journey remains private.
              </li>
            </ul>
          </section>

        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 py-4">
        ⚠️ ChatDoctor AI is an educational tool and does not replace professional medical advice.
      </div>

    </div>
  );
}

export default Home;
