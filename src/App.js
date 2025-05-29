import React, { useState } from "react";
import { Input, List, Spin, Typography, Button, Drawer, Pagination, Select } from "antd";
import { MenuOutlined, HomeOutlined, GlobalOutlined } from "@ant-design/icons";
import "./App.css";

const { Title, Text } = Typography;

// Component to handle collapsible abstracts
function ExpandAbstract({ abstract }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 200; // Maximum length before collapsing

  if (!abstract || abstract.length <= maxLength) {
    return <Text>{abstract?.replace(/^Abstract\s*/i, "") || "Unknown Abstract"}</Text>;
  }

  return (
    <div>
      <Text>
        {isExpanded
          ? abstract.replace(/^Abstract\s*/i, "")
          : `${abstract.replace(/^Abstract\s*/i, "").slice(0, maxLength)}...`}
      </Text>
      <a
        style={{ color: "#1890ff", marginLeft: "8px" }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "Collapse" : "Expand"}
      </a>
    </div>
  );
}

export default function SearchApp() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("rank");
  const [sortDirection, setSortDirection] = useState("asc");
  const pageSize = 8; // 8 results per page
  const [menuVisible, setMenuVisible] = useState(false);

  // Fetch additional metadata from OpenAlex
  const enrichResult = async (result) => {
    if (
      result.year !== "Unknown" &&
      result.location !== "Not Available" &&
      result.referencecount !== 0 &&
      result.abstract !== "Not Available"
    ) {
      return result;
    }

    try {
      const cleanDoi = result.doi?.replace(/^https?:\/\/doi\.org\//i, "");
      const response = await fetch(
        `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDoi)}`
      );
      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status}`);
      }
      const data = await response.json();

      let abstractText = "Not Available";
      if (data.abstract_inverted_index) {
        abstractText = Object.keys(data.abstract_inverted_index).join(" ");
      }

      return {
        ...result,
        year: data.publication_year ? String(data.publication_year) : result.year,
        location: data.primary_location?.source?.display_name || result.location,
        referencecount: data.cited_by_count ?? result.referencecount,
        abstract: abstractText,
      };
    } catch (error) {
      console.error(`Error fetching OpenAlex data for DOI ${result.doi}:`, error);
      return result;
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setCurrentPage(1);
    try {
      const response = await fetch(
        `https://api.scai.sh/search?query=${encodeURIComponent(query)}&limit=100&ai=false`,
        {
          method: "GET",
          mode: "cors",
          headers: {
            "Access-Control-Allow-Origin": true,
            "ngrok-skip-browser-warning": true,
            "Content-Type": "Authorization",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }
      const data = await response.json();
      const filteredResults = data.results.filter(
        (result) => result.source === "scihub" || result.scinet
      );
      const enrichedResults = await Promise.all(filteredResults.map(enrichResult));
      setResults(enrichedResults);
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sorting logic
  const sortResults = (results) => {
    return [...results].sort((a, b) => {
      let valueA, valueB;
      switch (sortField) {
        case "rank":
          valueA = a.rank || 0;
          valueB = b.rank || 0;
          break;
        case "year":
          valueA = parseInt(a.year) || 0;
          valueB = parseInt(b.year) || 0;
          break;
        case "referencecount":
          valueA = a.referencecount || 0;
          valueB = b.referencecount || 0;
          break;
        case "title":
          valueA = a.title?.toLowerCase() || "";
          valueB = b.title?.toLowerCase() || "";
          break;
        default:
          return 0;
      }

      if (sortField === "title") {
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueB);
      }

      return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
    });
  };

  // Apply sorting and pagination
  const sortedResults = sortResults(results);
  const paginatedResults = sortedResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSortChange = (value) => {
    const [field, direction] = value.split("_");
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#f0f2f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Navigation Bar */}
      <div
        className="navbar"
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          backgroundColor: "#fff",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          className="nav-links"
          style={{ display: "flex", gap: "20px", alignItems: "center" }}
        >
          <Title level={4} style={{ margin: 0, marginLeft: 20 }}>
            SciHub Search Engine
          </Title>
          <a style={{ cursor: "pointer", color: "black" }} href="https://sci-hub.se/">
            SciHub Official
          </a>
          <a style={{ cursor: "pointer", color: "black" }} href="https://t.me/WTFDeSci">
            SciHub Community
          </a>
        </div>

        <div
          className="nav-links"
          style={{ display: "flex", gap: "20px", alignItems: "center", marginRight: 20 }}
        >
          <Button
            type="primary"
            block
            style={{ height: "40px", fontSize: "16px" }}
            href="https://sci-net.xyz"
          >
            📖 Try Sci-Net
          </Button>
          <Button
            type="primary"
            danger
            block
            style={{ height: "40px", fontSize: "16px" }}
            href="https://scai.sh"
          >
            📜 Try Scaich
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          type="text"
          className="menu-button"
          onClick={() => setMenuVisible(true)}
          style={{ display: "none", alignItems: "center", textAlign: "center" }}
        >
          <Title level={4} style={{ margin: 0 }}>
            <MenuOutlined style={{ fontSize: "24px", marginRight: "10px" }} /> SciHub Search
          </Title>
        </Button>

        {/* Mobile Drawer */}
        <Drawer
          title="Menu"
          placement="left"
          onClose={() => setMenuVisible(false)}
          open={menuVisible}
          bodyStyle={{ padding: "20px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <Button href="https://sci-hub.se/">
              <HomeOutlined /> SciHub Official
            </Button>
            <Button href="https://www.scihub.fans/">
              <GlobalOutlined /> SciHub Community
            </Button>
            <Button href="https://www.okx.com/zh-hans/web3/detail/501/GxdTh6udNstGmLLk9ztBb6bkrms7oLbrJp5yzUaVpump">
              <GlobalOutlined /> Get SciHub Token
            </Button>
            <Button
              type="primary"
              block
              style={{ height: "40px", fontSize: "16px" }}
              href="https://sci-net.xyz"
            >
              📖 Try Sci-Net
            </Button>
            <Button
              type="primary"
              danger
              block
              style={{ height: "40px", fontSize: "16px" }}
              href="https://scai.sh"
            >
              📜 Try Scaich
            </Button>
          </div>
        </Drawer>
      </div>

      <div
        style={{
          width: "90%",
          padding: "0 1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: results.length > 0 ? "1rem" : "auto",
          paddingBottom: results.length > 0 ? "0" : "5rem",
          marginTop: results.length > 0 ? "1rem" : "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "2rem",
            marginBottom: "1rem",
          }}
        >
          <img
            src="/Sci-Hub_logo.png"
            alt="Sci-Hub Logo"
            style={{ height: "50px", marginRight: "20px" }}
          />
          <Title level={4} style={{ margin: 0 }}>
            SciHub Search Engine
            <Title level={4} style={{ margin: 0, fontWeight: "200" }}>
              Your Gateway to Open-Access Scientific Research
            </Title>
          </Title>
        </div>

        <Input.Search
          placeholder="Search from open-access scientific papers (Sci-Hub & Sci-Net)"
          enterButton="Search"
          size="large"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={handleSearch}
          loading={loading}
          style={{
            width: "100%",
            maxWidth: "1200px",
            marginBottom: "1rem",
            marginTop: "1rem",
          }}
        />
        <Title level={5} style={{ margin: 0, marginTop: "1rem", marginBottom: "1rem", opacity: 0.4 }}>
          <a style={{ color: "black", fontWeight: "300" }} href="https://www.scihub.fans/">
            Powered By SciHub & SciHub Web3 Community
          </a>
        </Title>

        {loading && (
          <div style={{ textAlign: "center", alignContent: "center", alignItems: "center" }}>
            <Spin size="large" style={{ marginTop: "1rem" }} />
            <Title level={5} style={{ marginTop: "2rem", marginBottom: "1rem", opacity: 0.4 }}>
              Waiting for the result ..
            </Title>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div
          style={{
            padding: "1rem",
            width: "90%",
            maxWidth: "1200px",
          }}
        >

          <List
            header={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <Title level={4} style={{ minWidth: 150, margin: 0 }}>
                  Search Results
                </Title>
                <Select
                  defaultValue="rank_asc"
                  style={{ Width: 200 }}
                  onChange={handleSortChange}
                  options={[
                    { value: "rank_asc", label: "Rank (Low to High)" },
                    { value: "rank_desc", label: "Rank (High to Low)" },
                    { value: "year_desc", label: "Year (Newest First)" },
                    { value: "year_asc", label: "Year (Oldest First)" },
                    { value: "referencecount_desc", label: "References (High to Low)" },
                    { value: "referencecount_asc", label: "References (Low to High)" },
                    { value: "title_asc", label: "Title (A to Z)" },
                    { value: "title_desc", label: "Title (Z to A)" },
                  ]}
                />
              </div>}
            bordered
            dataSource={paginatedResults}
            renderItem={(result) => {
              const cleanDoi = result.doi?.replace(/^https?:\/\/doi\.org\//i, "");
              const buttonUrl = result.scinet
                ? `https://sci-net.xyz/${cleanDoi}`
                : result.scihub_url || "#";
              const buttonText = result.scinet ? "View on Sci-Net" : "View on Sci-Hub";

              return (
                <List.Item>
                  <div style={{ width: "100%" }}>
                    <a href={buttonUrl} target="_blank" rel="noopener noreferrer">
                      <Title level={5} style={{ marginBottom: "0.5rem" }}>
                        {result.title || "Unknown Title"}
                      </Title>
                    </a>
                    <Text type="secondary" style={{ display: "block", marginBottom: "0.5rem" }}>
                      {result.author?.slice(0, 50) || "Unknown Author"}
                      {result.author?.length > 50 ? "..." : ""} - {result.year || "Unknown Year"}
                    </Text>
                    <ExpandAbstract abstract={result.abstract} />
                    <div style={{ marginTop: "0.5rem" }}>
                      <a
                        href={buttonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#1890ff", marginRight: "8px" }}
                      >
                        {buttonText}
                      </a>
                      <Text type="secondary">Citation: {result.referencecount || 0}</Text>
                    </div>
                  </div>
                </List.Item>
              );
            }}
            style={{ background: "#fff" }}
          />
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={results.length}
            onChange={(page) => setCurrentPage(page)}
            style={{ marginTop: "1rem", textAlign: "center" }}
            showSizeChanger={false}
            responsive={true}
          />
        </div>
      )}
    </div>
  );
}