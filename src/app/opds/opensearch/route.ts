import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>Bookhoarder</ShortName>
  <Description>Search your Bookhoarder library</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Url type="application/atom+xml;profile=opds-catalog;kind=acquisition"
       template="/opds/search?q={searchTerms}"/>
</OpenSearchDescription>
`;
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/opensearchdescription+xml" },
  });
}
