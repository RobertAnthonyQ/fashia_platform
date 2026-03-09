"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { useEffect, useState } from "react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch("/api/swagger")
      .then((res) => res.json())
      .then((data) => setSpec(data));
  }, []);

  if (!spec) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading API documentation...
      </div>
    );
  }

  return (
    <section style={{ padding: "1rem" }}>
      <SwaggerUI spec={spec} />
    </section>
  );
}
