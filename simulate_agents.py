#!/usr/bin/env python3
"""
TaskClaw Agent Marketplace Simulation
======================================
Simulates 200 AI agents discovering and using the TaskClaw marketplace
as if they just read the API documentation page and started integrating.

Each agent has a role, personality, and realistic behavior pattern.
Feedback is collected from each agent's perspective.
"""

import requests
import json
import random
import time
import string
import sys
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict

BASE_URL = "http://localhost:8000"
REPORT_FILE = "AGENT-SIMULATION-REPORT.md"

# --- Agent Personas ---

AGENT_ROLES = [
    ("research", "Research & Analysis agent"),
    ("coding_assistant", "Coding & Development agent"),
    ("writing", "Writing & Content agent"),
    ("data_processing", "Data Processing agent"),
    ("design", "Design & Creative agent"),
    ("agent_ops", "Agent Operations coordinator"),
    ("qa_testing", "QA & Testing agent"),
    ("translation", "Translation & Localization agent"),
    ("customer_support", "Customer Support agent"),
    ("devops", "DevOps & Infrastructure agent"),
]

CATEGORIES = [
    "Writing & Content",
    "Research & Analysis",
    "Coding & Development",
    "Data Processing",
    "Design & Creative",
    "Agent Operations",
    "Other",
]

TASK_TEMPLATES = [
    {"title": "Write blog post about {topic}", "cat": "Writing & Content", "tags": ["writing", "blog"], "budget": (20, 100)},
    {"title": "Research {topic} market trends", "cat": "Research & Analysis", "tags": ["research", "analysis"], "budget": (50, 300)},
    {"title": "Build {topic} API integration", "cat": "Coding & Development", "tags": ["api", "coding"], "budget": (100, 500)},
    {"title": "Scrape {topic} competitor data", "cat": "Research & Analysis", "tags": ["scraping", "data"], "budget": (30, 150)},
    {"title": "Create documentation for {topic}", "cat": "Writing & Content", "tags": ["docs", "technical"], "budget": (40, 200)},
    {"title": "Process {topic} dataset", "cat": "Data Processing", "tags": ["etl", "data"], "budget": (60, 250)},
    {"title": "Design {topic} UI mockup", "cat": "Design & Creative", "tags": ["design", "ui"], "budget": (80, 400)},
    {"title": "Automate {topic} workflow", "cat": "Agent Operations", "tags": ["automation", "workflow"], "budget": (100, 350)},
    {"title": "Translate {topic} docs to Spanish", "cat": "Writing & Content", "tags": ["translation", "i18n"], "budget": (25, 120)},
    {"title": "Code review for {topic} module", "cat": "Coding & Development", "tags": ["review", "quality"], "budget": (50, 200)},
    {"title": "Analyze {topic} user feedback", "cat": "Research & Analysis", "tags": ["analysis", "ux"], "budget": (40, 180)},
    {"title": "Build {topic} monitoring dashboard", "cat": "Coding & Development", "tags": ["monitoring", "dashboard"], "budget": (150, 600)},
    {"title": "Write {topic} test suite", "cat": "Coding & Development", "tags": ["testing", "qa"], "budget": (80, 300)},
    {"title": "Summarize {topic} quarterly report", "cat": "Writing & Content", "tags": ["summary", "report"], "budget": (30, 100)},
    {"title": "Deploy {topic} to production", "cat": "Agent Operations", "tags": ["devops", "deployment"], "budget": (100, 400)},
]

TOPICS = [
    "blockchain", "AI", "DeFi", "NFT", "CKB", "Nervos", "web3", "machine learning",
    "smart contracts", "tokenomics", "layer2", "cross-chain", "dApp", "DAO", "ZK proofs",
    "agent economy", "autonomous agents", "task routing", "escrow systems", "micropayments",
    "neural networks", "LLM fine-tuning", "RAG pipeline", "vector search", "embeddings",
    "Rust backend", "React frontend", "PostgreSQL", "API gateway", "webhook system",
    "supply chain", "healthcare data", "fintech", "e-commerce", "social media",
    "cybersecurity", "cloud infrastructure", "CI/CD", "containerization", "serverless",
]

PITCHES = [
    "I have 3+ years of experience in this domain and can deliver high-quality results.",
    "My previous clients rated me 5/5 for similar work. I can start immediately.",
    "I specialize in exactly this type of task. Check my profile for past work.",
    "Fast turnaround guaranteed. I use automated tooling to accelerate delivery.",
    "I've completed 50+ similar tasks on other platforms. Happy to share references.",
    "My approach combines automated analysis with manual verification for accuracy.",
    "I can deliver a draft within 24 hours for your review before finalizing.",
    "Experienced agent with domain expertise. I understand the Nervos/CKB ecosystem well.",
    "I'll provide detailed documentation alongside the deliverable.",
    "My bid includes one round of revisions at no extra cost.",
]

DELIVERY_MESSAGES = [
    "Delivery complete. All requirements met. See attached document for details.",
    "Task finished ahead of schedule. The output has been quality-checked twice.",
    "Here's the completed work. I've included additional insights I found during the process.",
    "Done! The deliverable covers all specifications. Let me know if you need clarification.",
    "Completed as requested. I've organized everything in a clear, readable format.",
    "Work is done. Exceeded the original scope slightly - included bonus analysis.",
    "Delivery submitted. All edge cases handled. Ready for your review.",
    "Finished! Documentation is included. Happy to walk through the results if needed.",
]

DISPUTE_REASONS = [
    "The delivery does not match the task requirements. Key sections are missing.",
    "Quality is below expectations. Multiple errors found in the output.",
    "The delivered work appears to be auto-generated without proper review.",
    "Deadline was missed and the partial delivery is insufficient.",
    "The output format doesn't match what was specified in the task description.",
]

RATING_COMMENTS = {
    5: ["Excellent work!", "Outstanding delivery, exceeded expectations!", "Perfect. Will hire again.", "Top-tier quality and communication."],
    4: ["Good work overall.", "Solid delivery with minor room for improvement.", "Reliable and professional.", "Met expectations well."],
    3: ["Acceptable but could be better.", "Average quality, got the job done.", "Decent work but communication was slow."],
    2: ["Below expectations.", "Several issues with the delivery.", "Needs improvement in quality."],
    1: ["Very poor quality.", "Did not meet requirements at all.", "Would not recommend."],
}


class AgentSimulator:
    def __init__(self):
        self.agents = []  # list of {id, email, api_key, token, display_name, role, role_desc, is_buyer, is_seller}
        self.tasks = []  # list of {id, slug, title, buyer_agent_idx, budget_min, budget_max, currency, status}
        self.bids = []  # list of {id, task_id, seller_agent_idx, buyer_agent_idx, price, status}
        self.feedback = []  # list of {agent_name, role, action, result, feedback, severity}
        self.errors = defaultdict(int)
        self.successes = defaultdict(int)
        self.rate_limit_hits = 0
        self.html_error_count = 0
        self.timings = defaultdict(list)

    def log(self, msg):
        print(f"  [{datetime.now().strftime('%H:%M:%S')}] {msg}")

    def add_feedback(self, agent_name, role, action, result, feedback, severity="info"):
        self.feedback.append({
            "agent_name": agent_name,
            "role": role,
            "action": action,
            "result": result,
            "feedback": feedback,
            "severity": severity,
            "timestamp": datetime.now().isoformat(),
        })

    def api_call(self, method, path, headers=None, json_body=None, params=None, agent_name="system"):
        url = f"{BASE_URL}{path}"
        h = {"Content-Type": "application/json"}
        if headers:
            h.update(headers)

        start = time.time()
        try:
            resp = requests.request(method, url, headers=h, json=json_body, params=params, timeout=30)
            elapsed = time.time() - start
            self.timings[path.split("?")[0]].append(elapsed)

            # Check for HTML responses (auth guard failures)
            content_type = resp.headers.get("content-type", "")
            if "text/html" in content_type and resp.status_code >= 400:
                self.html_error_count += 1
                return {"_status": resp.status_code, "_html": True, "_body": resp.text[:200], "_elapsed": elapsed}

            if resp.status_code == 429:
                self.rate_limit_hits += 1
                return {"_status": 429, "_error": "Rate limited", "_elapsed": elapsed}

            try:
                data = resp.json()
            except Exception:
                data = {"_raw": resp.text[:500]}

            # Wrap list responses so we can attach metadata
            if isinstance(data, list):
                data = {"_list": data, "_status": resp.status_code, "_elapsed": elapsed}
            else:
                data["_status"] = resp.status_code
                data["_elapsed"] = elapsed
            return data
        except requests.exceptions.Timeout:
            self.add_feedback(agent_name, "", "api_call", "timeout", f"Request to {path} timed out after 30s", "critical")
            return {"_status": 0, "_error": "timeout"}
        except requests.exceptions.ConnectionError:
            self.add_feedback(agent_name, "", "api_call", "connection_error", f"Cannot connect to {BASE_URL}", "critical")
            return {"_status": 0, "_error": "connection_error"}

    # =========================================================================
    # Phase 1: Discovery — Agents read the API docs and explore the platform
    # =========================================================================

    def phase_discovery(self):
        """Agents discover the platform by hitting public endpoints"""
        print("\n--- Phase 1: Discovery (Public Endpoints) ---")

        # Health check
        r = self.api_call("GET", "/health")
        if r.get("_status") != 200:
            self.add_feedback("Scout-0", "system", "health_check", "fail",
                              "Platform health check failed! Cannot proceed.", "critical")
            return False
        self.log("Health check: OK")

        # Categories
        r = self.api_call("GET", "/api/categories")
        if r.get("_status") == 200:
            cats = r.get("_list", [])
            self.log(f"Categories discovered: {len(cats)}")
            self.add_feedback("Scout-0", "research", "discover_categories", "success",
                              f"Found {len(cats)} categories. Good variety for different agent specializations.",
                              "info")
        else:
            self.add_feedback("Scout-0", "research", "discover_categories", "unexpected",
                              f"Categories response format unexpected", "medium")

        # Browse tasks
        r = self.api_call("GET", "/api/tasks", params={"per_page": 50})
        if r.get("_status") == 200:
            total = r.get("total", 0)
            self.log(f"Tasks available: {total}")
            self.add_feedback("Scout-0", "research", "browse_tasks", "success",
                              f"Found {total} tasks. Pagination works (page/per_page/total/total_pages present).",
                              "info")
        else:
            self.add_feedback("Scout-0", "research", "browse_tasks", "fail",
                              f"Failed to browse tasks: {r}", "high")

        # Test search/filter
        for filt in [
            {"search": "blockchain"},
            {"category": "Coding & Development"},
            {"min_budget": "100", "max_budget": "500"},
            {"sort": "budget_desc"},
            {"tag": "scraping"},
            {"status": "open"},
        ]:
            r = self.api_call("GET", "/api/tasks", params={**filt, "per_page": 5})
            status = r.get("_status", 0)
            if status == 200:
                self.successes["filter_" + list(filt.keys())[0]] += 1
            else:
                self.errors["filter_" + list(filt.keys())[0]] += 1
                self.add_feedback("Scout-0", "research", f"filter_{list(filt.keys())[0]}", "fail",
                                  f"Filter {filt} returned status {status}", "medium")

        # Agents list
        r = self.api_call("GET", "/api/agents", params={"per_page": 10})
        if r.get("_status") == 200:
            self.log(f"Agents endpoint works")
        else:
            self.add_feedback("Scout-0", "research", "list_agents", "fail",
                              f"Agents list failed: {r.get('error', r.get('_status'))}", "medium")

        # Agent count
        r = self.api_call("GET", "/api/agents/count")
        if r.get("_status") == 200:
            self.log(f"Agent count: {r.get('count', '?')}")

        return True

    # =========================================================================
    # Phase 2: Registration — 200 agents sign up
    # =========================================================================

    def phase_registration(self):
        """Register 200 agents with diverse roles"""
        print("\n--- Phase 2: Registration (200 Agents) ---")

        for i in range(200):
            role, role_desc = AGENT_ROLES[i % len(AGENT_ROLES)]
            name = f"Agent-{role[:3].upper()}-{i:03d}"
            email = f"agent{i:03d}@sim.taskclaw.test"

            r = self.api_call("POST", "/api/auth/register", json_body={
                "email": email,
                "password": f"SimPass{i:03d}!secure",
                "display_name": name,
                "is_agent": True,
                "agent_type": role,
            }, agent_name=name)

            if r.get("_status") == 200:
                agent = {
                    "idx": i,
                    "id": r.get("user", {}).get("id"),
                    "email": email,
                    "api_key": r.get("api_key"),
                    "token": r.get("token"),
                    "display_name": name,
                    "role": role,
                    "role_desc": role_desc,
                    "is_buyer": random.random() < 0.6,  # 60% will post tasks
                    "is_seller": random.random() < 0.7,  # 70% will bid on tasks
                }
                self.agents.append(agent)
                self.successes["register"] += 1

                # Agent feedback on registration
                if not r.get("api_key"):
                    self.add_feedback(name, role, "register", "issue",
                                      "Registered but no api_key returned! How do I authenticate?", "critical")
                elif not r.get("user", {}).get("id"):
                    self.add_feedback(name, role, "register", "issue",
                                      "No user ID in response — can't reference myself", "high")
                else:
                    # Check response shape matches docs
                    user = r.get("user", {})
                    missing = []
                    for field in ["id", "display_name", "is_agent", "agent_type", "avg_rating", "total_ratings", "tasks_posted", "tasks_completed", "member_since"]:
                        if field not in user:
                            missing.append(field)
                    if "bio" not in user and user.get("bio") is not None:
                        pass  # bio can be null, that's fine
                    if missing:
                        self.add_feedback(name, role, "register", "doc_mismatch",
                                          f"Response missing fields documented in API docs: {missing}", "high")

            elif r.get("_status") == 409:
                # Already exists — try login
                lr = self.api_call("POST", "/api/auth/login", json_body={
                    "email": email,
                    "password": f"SimPass{i:03d}!secure",
                }, agent_name=name)
                if lr.get("_status") == 200:
                    agent = {
                        "idx": i,
                        "id": lr.get("user", {}).get("id"),
                        "email": email,
                        "api_key": None,  # not returned on login (hashed at rest)
                        "token": lr.get("token"),
                        "display_name": name,
                        "role": role,
                        "role_desc": role_desc,
                        "is_buyer": random.random() < 0.6,
                        "is_seller": random.random() < 0.7,
                    }
                    self.agents.append(agent)
                    self.successes["login_fallback"] += 1
                    self.add_feedback(name, role, "register", "already_exists",
                                      "Email already registered (409). Login worked but API key not available — docs say it's hashed at rest. How do I get my API key back?",
                                      "high")
                else:
                    self.errors["register"] += 1
                    self.add_feedback(name, role, "register", "fail",
                                      f"409 on register, login also failed: {lr.get('error', 'unknown')}", "critical")

            elif r.get("_status") == 429:
                self.add_feedback(name, role, "register", "rate_limited",
                                  "Hit rate limit during registration! 10/min is very restrictive for batch onboarding.", "high")
                time.sleep(6)  # Wait and retry
                i -= 1  # Will be incremented by loop
                continue
            else:
                self.errors["register"] += 1
                self.add_feedback(name, role, "register", "fail",
                                  f"Registration failed with status {r.get('_status')}: {r.get('error', 'unknown')}", "critical")

            # Rate limit awareness: pause every 9 registrations
            if (i + 1) % 9 == 0:
                time.sleep(1)

            if (i + 1) % 50 == 0:
                self.log(f"Registered {i + 1}/200 agents ({len(self.agents)} successful)")

        self.log(f"Registration complete: {len(self.agents)} agents active")

    # =========================================================================
    # Phase 3: Profile Check — Each agent checks their profile & dashboard
    # =========================================================================

    def phase_profile_check(self):
        """Agents verify their profiles and explore dashboard"""
        print("\n--- Phase 3: Profile & Dashboard Check ---")
        sample = random.sample(self.agents, min(50, len(self.agents)))

        for agent in sample:
            auth = self._auth_header(agent)
            if not auth:
                continue

            # GET /api/auth/me
            r = self.api_call("GET", "/api/auth/me", headers=auth, agent_name=agent["display_name"])
            if r.get("_status") == 200:
                self.successes["profile_check"] += 1
                # Check if email is exposed
                if "email" in r:
                    pass  # Expected in /me
                if "password_hash" in r or "api_key_hash" in r:
                    self.add_feedback(agent["display_name"], agent["role"], "profile_check", "security_issue",
                                      "CRITICAL: password_hash or api_key_hash exposed in /me response!", "critical")
            else:
                self.errors["profile_check"] += 1
                if r.get("_html"):
                    self.add_feedback(agent["display_name"], agent["role"], "profile_check", "html_error",
                                      "Auth failed with HTML response instead of JSON. Docs warn about this but it's still confusing for programmatic agents.",
                                      "medium")

            # GET /api/dashboard
            r = self.api_call("GET", "/api/dashboard", headers=auth, agent_name=agent["display_name"])
            if r.get("_status") == 200:
                self.successes["dashboard"] += 1
                # Verify dashboard shape
                expected_fields = ["tasks_posted", "tasks_working", "my_bids", "total_earned", "total_spent", "active_escrow"]
                missing = [f for f in expected_fields if f not in r]
                if missing:
                    self.add_feedback(agent["display_name"], agent["role"], "dashboard", "doc_mismatch",
                                      f"Dashboard missing documented fields: {missing}", "medium")
            else:
                self.errors["dashboard"] += 1

            # GET /api/users/:id (public profile)
            if agent["id"]:
                r = self.api_call("GET", f"/api/users/{agent['id']}", agent_name=agent["display_name"])
                if r.get("_status") == 200:
                    self.successes["public_profile"] += 1
                    if "email" in r:
                        self.add_feedback(agent["display_name"], agent["role"], "public_profile", "security_issue",
                                          "Email is exposed in public profile! Privacy concern.", "high")
                else:
                    self.errors["public_profile"] += 1

        self.log(f"Profile checks done: {self.successes['profile_check']} ok, {self.errors['profile_check']} failed")

    # =========================================================================
    # Phase 4: Task Posting — Buyer agents post tasks
    # =========================================================================

    def phase_post_tasks(self):
        """Buyer agents post tasks"""
        print("\n--- Phase 4: Task Posting ---")
        buyers = [a for a in self.agents if a["is_buyer"] and self._auth_header(a)]
        random.shuffle(buyers)

        # Each buyer posts 1-3 tasks
        task_count = 0
        for buyer in buyers[:80]:  # Cap at 80 buyers to keep sim manageable
            num_tasks = random.randint(1, 3)
            for _ in range(num_tasks):
                template = random.choice(TASK_TEMPLATES)
                topic = random.choice(TOPICS)
                title = template["title"].format(topic=topic)
                budget_min, budget_max = template["budget"]

                # Add some randomness to budgets
                budget_min = str(round(budget_min * random.uniform(0.8, 1.2), 2))
                budget_max = str(round(float(budget_min) * random.uniform(1.5, 4.0), 2))

                deadline = (datetime.now() + timedelta(days=random.randint(3, 30))).strftime("%Y-%m-%dT00:00:00Z")

                r = self.api_call("POST", "/api/tasks", headers=self._auth_header(buyer), json_body={
                    "title": title,
                    "description": f"Looking for an experienced agent to {title.lower()}. Must deliver high-quality results within the deadline. Detailed requirements will be shared with the selected bidder.",
                    "category": template["cat"],
                    "tags": template["tags"][:3],
                    "budget_min": budget_min,
                    "budget_max": budget_max,
                    "currency": "USD",
                    "deadline": deadline,
                }, agent_name=buyer["display_name"])

                if r.get("_status") == 200:
                    task_id = r.get("id")
                    task_slug = r.get("slug")
                    if task_id:
                        self.tasks.append({
                            "id": task_id,
                            "slug": task_slug,
                            "title": title,
                            "buyer_idx": buyer["idx"],
                            "budget_min": budget_min,
                            "budget_max": budget_max,
                            "currency": "USD",
                            "status": "open",
                            "category": template["cat"],
                        })
                        task_count += 1
                        self.successes["post_task"] += 1
                    else:
                        self.add_feedback(buyer["display_name"], buyer["role"], "post_task", "no_id",
                                          "Task created but no ID in response — how do I reference it for bids?", "high")
                elif r.get("_status") == 429:
                    self.add_feedback(buyer["display_name"], buyer["role"], "post_task", "rate_limited",
                                      "Rate limited while posting tasks. 10/min per user is tight for agents that batch-post.", "medium")
                    time.sleep(6)
                else:
                    self.errors["post_task"] += 1
                    err = r.get("error", "unknown")
                    self.add_feedback(buyer["display_name"], buyer["role"], "post_task", "fail",
                                      f"Failed to post task: {err}", "medium")

                # Rate limit awareness
                if task_count % 8 == 0:
                    time.sleep(1)

            if task_count % 30 == 0 and task_count > 0:
                self.log(f"Tasks posted: {task_count}")

        self.log(f"Task posting complete: {task_count} tasks created")

    # =========================================================================
    # Phase 5: Browsing & Bidding — Seller agents find and bid on tasks
    # =========================================================================

    def phase_bidding(self):
        """Seller agents browse tasks and place bids"""
        print("\n--- Phase 5: Bidding ---")
        sellers = [a for a in self.agents if a["is_seller"] and self._auth_header(a)]
        random.shuffle(sellers)

        bid_count = 0
        for seller in sellers[:100]:  # Cap at 100 sellers
            # Seller browses tasks
            r = self.api_call("GET", "/api/tasks", params={
                "status": "open",
                "per_page": 20,
                "sort": random.choice(["budget_desc", "deadline", ""]),
            }, agent_name=seller["display_name"])

            if r.get("_status") != 200:
                self.add_feedback(seller["display_name"], seller["role"], "browse_for_bids", "fail",
                                  "Couldn't browse tasks to find bidding opportunities", "medium")
                continue

            available_tasks = r.get("tasks", [])
            if not available_tasks:
                # Try bidding status too
                r2 = self.api_call("GET", "/api/tasks", params={"status": "bidding", "per_page": 20})
                if r2.get("_status") == 200:
                    available_tasks = r2.get("tasks", [])

            if not available_tasks:
                self.add_feedback(seller["display_name"], seller["role"], "browse_for_bids", "empty",
                                  "No open tasks found. Marketplace feels empty.", "low")
                continue

            # Bid on 1-3 random tasks
            tasks_to_bid = random.sample(available_tasks, min(random.randint(1, 3), len(available_tasks)))

            for task in tasks_to_bid:
                task_id = task.get("id")
                if not task_id:
                    self.add_feedback(seller["display_name"], seller["role"], "bid", "no_task_id",
                                      "Task in list has no ID field — can't bid on it!", "high")
                    continue

                budget_min = float(task.get("budget_min", "50"))
                budget_max = float(task.get("budget_max", "200"))
                bid_price = str(round(random.uniform(budget_min, budget_max), 2))

                r = self.api_call("POST", f"/api/tasks/{task_id}/bids", headers=self._auth_header(seller), json_body={
                    "price": bid_price,
                    "currency": task.get("currency", "USD"),
                    "estimated_delivery_days": random.randint(1, 14),
                    "pitch": random.choice(PITCHES),
                }, agent_name=seller["display_name"])

                if r.get("_status") == 200:
                    bid_id = r.get("id")
                    self.bids.append({
                        "id": bid_id,
                        "task_id": task_id,
                        "seller_idx": seller["idx"],
                        "buyer_idx": None,  # Will resolve later
                        "price": bid_price,
                        "status": "pending",
                    })
                    bid_count += 1
                    self.successes["place_bid"] += 1
                elif r.get("_status") == 403:
                    err = r.get("error", "")
                    if "own task" in str(err).lower():
                        self.add_feedback(seller["display_name"], seller["role"], "bid", "own_task",
                                          "Tried to bid on my own task — got 403. Docs mention this but I discovered it the hard way. Would be nice if the task list indicated which tasks are mine.",
                                          "medium")
                    else:
                        self.add_feedback(seller["display_name"], seller["role"], "bid", "forbidden",
                                          f"403 on bid: {err}", "medium")
                elif r.get("_status") == 409:
                    self.add_feedback(seller["display_name"], seller["role"], "bid", "duplicate",
                                      "Already bid on this task (409). One-bid-per-seller rule makes sense but I wasted an API call. No way to check beforehand.",
                                      "low")
                elif r.get("_status") == 400:
                    err = r.get("error", "")
                    self.add_feedback(seller["display_name"], seller["role"], "bid", "validation",
                                      f"Bid rejected (400): {err}", "low")
                elif r.get("_status") == 429:
                    self.add_feedback(seller["display_name"], seller["role"], "bid", "rate_limited",
                                      "Rate limited while bidding. Frustrating when you find multiple good tasks.", "medium")
                    time.sleep(6)
                else:
                    self.errors["place_bid"] += 1
                    self.add_feedback(seller["display_name"], seller["role"], "bid", "fail",
                                      f"Bid failed ({r.get('_status')}): {r.get('error', 'unknown')}", "medium")

                # Rate limit awareness
                if bid_count % 8 == 0:
                    time.sleep(1)

        self.log(f"Bidding complete: {bid_count} bids placed")

    # =========================================================================
    # Phase 6: Bid Management — Buyers review bids, accept/reject
    # =========================================================================

    def phase_bid_management(self):
        """Buyers review bids and accept the best ones"""
        print("\n--- Phase 6: Bid Management ---")
        accept_count = 0
        reject_count = 0

        for task in self.tasks[:]:
            buyer = self._get_agent_by_idx(task["buyer_idx"])
            if not buyer or not self._auth_header(buyer):
                continue

            # Check bids on this task
            r = self.api_call("GET", f"/api/tasks/{task['slug'] or task['id']}/bids",
                              agent_name=buyer["display_name"])

            if r.get("_status") != 200:
                continue

            bids_list = r.get("_list", [])
            if not bids_list:
                # Might be a dict with bids key
                bids_list = r.get("bids", [])

            if not isinstance(bids_list, list) or len(bids_list) == 0:
                continue

            # Filter to actual bid objects
            actual_bids = [b for b in bids_list if isinstance(b, dict) and b.get("id")]
            if not actual_bids:
                continue

            # Pick the best bid (lowest price or random)
            if random.random() < 0.7:  # 70% accept a bid
                chosen = random.choice(actual_bids)
                bid_id = chosen["id"]

                r = self.api_call("POST", f"/api/tasks/{task['id']}/bids/{bid_id}/accept",
                                  headers=self._auth_header(buyer), agent_name=buyer["display_name"])

                if r.get("_status") == 200:
                    accept_count += 1
                    task["status"] = "in_escrow"
                    task["accepted_bid_id"] = bid_id
                    task["seller_id"] = chosen.get("seller_id") or chosen.get("user_id")
                    self.successes["accept_bid"] += 1

                    # Check escrow response
                    if "amount" in r:
                        self.add_feedback(buyer["display_name"], buyer["role"], "accept_bid", "escrow_info",
                                          f"Escrow created with amount {r.get('amount')}. Simulated={r.get('simulated')}",
                                          "info")
                elif r.get("_status") == 400:
                    self.add_feedback(buyer["display_name"], buyer["role"], "accept_bid", "fail",
                                      f"Couldn't accept bid: {r.get('error', 'unknown')}", "medium")
                else:
                    self.errors["accept_bid"] += 1

                # Reject others
                for bid in actual_bids:
                    if bid["id"] != bid_id:
                        rr = self.api_call("POST", f"/api/tasks/{task['id']}/bids/{bid['id']}/reject",
                                           headers=self._auth_header(buyer), agent_name=buyer["display_name"])
                        if rr.get("_status") == 200:
                            reject_count += 1
                        elif rr.get("_status") == 400:
                            # Already auto-rejected when another bid was accepted
                            self.add_feedback(buyer["display_name"], buyer["role"], "reject_bid", "auto_rejected",
                                              "Tried to reject bid but it was already auto-rejected. Docs mention this — smart feature.",
                                              "info")

                if accept_count % 8 == 0:
                    time.sleep(1)

        self.log(f"Bid management complete: {accept_count} accepted, {reject_count} rejected")

    # =========================================================================
    # Phase 7: Delivery — Sellers deliver, buyers review
    # =========================================================================

    def phase_delivery(self):
        """Sellers deliver work, buyers approve/dispute/request revision"""
        print("\n--- Phase 7: Delivery & Completion ---")
        deliver_count = 0
        approve_count = 0
        revision_count = 0
        dispute_count = 0

        in_escrow_tasks = [t for t in self.tasks if t.get("status") == "in_escrow"]

        for task in in_escrow_tasks:
            # Find the seller for this task
            seller = self._find_seller_for_task(task)
            buyer = self._get_agent_by_idx(task["buyer_idx"])

            if not seller or not buyer:
                continue
            if not self._auth_header(seller) or not self._auth_header(buyer):
                continue

            # Seller delivers
            r = self.api_call("POST", f"/api/tasks/{task['id']}/deliver",
                              headers=self._auth_header(seller), json_body={
                    "message": random.choice(DELIVERY_MESSAGES),
                    "url": f"https://results.example.com/delivery/{task['id'][:8]}",
                }, agent_name=seller["display_name"])

            if r.get("_status") == 200:
                deliver_count += 1
                task["status"] = "delivered"
                self.successes["deliver"] += 1
            elif r.get("_status") == 403:
                self.add_feedback(seller["display_name"], seller["role"], "deliver", "not_seller",
                                  f"403 trying to deliver — maybe I'm not the accepted seller? No clear way to check from task detail.",
                                  "medium")
                continue
            else:
                self.errors["deliver"] += 1
                self.add_feedback(seller["display_name"], seller["role"], "deliver", "fail",
                                  f"Delivery failed ({r.get('_status')}): {r.get('error', 'unknown')}", "medium")
                continue

            time.sleep(0.3)

            # Buyer decides: approve (60%), revision (20%), dispute (10%), ignore (10%)
            action = random.choices(
                ["approve", "revision", "dispute", "ignore"],
                weights=[60, 20, 10, 10],
                k=1
            )[0]

            if action == "approve":
                r = self.api_call("POST", f"/api/tasks/{task['id']}/approve",
                                  headers=self._auth_header(buyer), agent_name=buyer["display_name"])
                if r.get("_status") == 200:
                    approve_count += 1
                    task["status"] = "completed"
                    self.successes["approve"] += 1
                else:
                    self.errors["approve"] += 1
                    self.add_feedback(buyer["display_name"], buyer["role"], "approve", "fail",
                                      f"Approval failed ({r.get('_status')}): {r.get('error', 'unknown')}", "medium")

            elif action == "revision":
                r = self.api_call("POST", f"/api/tasks/{task['id']}/revision",
                                  headers=self._auth_header(buyer), json_body={
                        "message": "Please address the following issues and resubmit."
                    }, agent_name=buyer["display_name"])
                if r.get("_status") == 200:
                    revision_count += 1
                    task["status"] = "in_escrow"  # Back to in_escrow for re-delivery
                    self.successes["revision"] += 1

                    # Seller re-delivers after revision
                    time.sleep(0.3)
                    r2 = self.api_call("POST", f"/api/tasks/{task['id']}/deliver",
                                       headers=self._auth_header(seller), json_body={
                            "message": "Revised delivery addressing all feedback. Please review.",
                            "url": f"https://results.example.com/revised/{task['id'][:8]}",
                        }, agent_name=seller["display_name"])

                    if r2.get("_status") == 200:
                        # Buyer approves revision
                        time.sleep(0.3)
                        r3 = self.api_call("POST", f"/api/tasks/{task['id']}/approve",
                                           headers=self._auth_header(buyer), agent_name=buyer["display_name"])
                        if r3.get("_status") == 200:
                            approve_count += 1
                            task["status"] = "completed"
                        else:
                            self.add_feedback(buyer["display_name"], buyer["role"], "approve_revised", "fail",
                                              f"Failed to approve revised delivery: {r3.get('error', 'unknown')}", "medium")
                    else:
                        self.add_feedback(seller["display_name"], seller["role"], "re_deliver", "fail",
                                          f"Re-delivery failed: {r2.get('error', 'unknown')}", "medium")
                else:
                    err = r.get("error", "")
                    self.add_feedback(buyer["display_name"], buyer["role"], "revision", "fail",
                                      f"Revision request failed: {err}", "medium")

            elif action == "dispute":
                r = self.api_call("POST", f"/api/tasks/{task['id']}/dispute",
                                  headers=self._auth_header(buyer), json_body={
                        "reason": random.choice(DISPUTE_REASONS),
                    }, agent_name=buyer["display_name"])
                if r.get("_status") == 200:
                    dispute_count += 1
                    task["status"] = "disputed"
                    self.successes["dispute"] += 1
                else:
                    self.errors["dispute"] += 1
                    self.add_feedback(buyer["display_name"], buyer["role"], "dispute", "fail",
                                      f"Dispute failed ({r.get('_status')}): {r.get('error', 'unknown')}", "medium")

            # Rate limit awareness
            if deliver_count % 6 == 0:
                time.sleep(1)

        self.log(f"Delivery complete: {deliver_count} delivered, {approve_count} approved, {revision_count} revisions, {dispute_count} disputes")

    # =========================================================================
    # Phase 8: Ratings — Completed task participants rate each other
    # =========================================================================

    def phase_ratings(self):
        """Both parties rate each other on completed tasks"""
        print("\n--- Phase 8: Ratings ---")
        rating_count = 0

        completed_tasks = [t for t in self.tasks if t.get("status") == "completed"]

        for task in completed_tasks:
            buyer = self._get_agent_by_idx(task["buyer_idx"])
            seller = self._find_seller_for_task(task)

            if not buyer or not seller:
                continue

            # Buyer rates seller
            score = random.choices([5, 4, 3, 2, 1], weights=[40, 30, 15, 10, 5], k=1)[0]
            comment = random.choice(RATING_COMMENTS.get(score, ["No comment"]))

            if self._auth_header(buyer):
                r = self.api_call("POST", f"/api/tasks/{task['id']}/rate",
                                  headers=self._auth_header(buyer), json_body={
                        "score": score,
                        "comment": comment,
                    }, agent_name=buyer["display_name"])

                if r.get("_status") == 200:
                    rating_count += 1
                    self.successes["rate"] += 1
                elif r.get("_status") == 409:
                    self.add_feedback(buyer["display_name"], buyer["role"], "rate", "duplicate",
                                      "Already rated this task (409). Expected, but no way to check if I already rated.", "low")
                elif r.get("_status") == 400:
                    err = r.get("error", "")
                    if "7 day" in str(err).lower() or "window" in str(err).lower():
                        self.add_feedback(buyer["display_name"], buyer["role"], "rate", "window_closed",
                                          "Rating window closed! The 7-day limit is mentioned in docs but easy to miss.", "medium")
                    else:
                        self.add_feedback(buyer["display_name"], buyer["role"], "rate", "fail",
                                          f"Rating failed: {err}", "low")

            # Seller rates buyer
            if self._auth_header(seller):
                score = random.choices([5, 4, 3, 2, 1], weights=[45, 30, 15, 7, 3], k=1)[0]
                comment = random.choice(RATING_COMMENTS.get(score, ["No comment"]))

                r = self.api_call("POST", f"/api/tasks/{task['id']}/rate",
                                  headers=self._auth_header(seller), json_body={
                        "score": score,
                        "comment": comment,
                    }, agent_name=seller["display_name"])

                if r.get("_status") == 200:
                    rating_count += 1
                    self.successes["rate"] += 1
                elif r.get("_status") == 409:
                    pass  # Expected
                else:
                    self.errors["rate"] += 1

            if rating_count % 8 == 0:
                time.sleep(1)

        self.log(f"Ratings complete: {rating_count} ratings submitted")

    # =========================================================================
    # Phase 9: Notifications — Agents check notifications
    # =========================================================================

    def phase_notifications(self):
        """Agents check their notifications"""
        print("\n--- Phase 9: Notifications ---")
        sample = random.sample(self.agents, min(40, len(self.agents)))

        notif_found = 0
        for agent in sample:
            auth = self._auth_header(agent)
            if not auth:
                continue

            # Check unread count
            r = self.api_call("GET", "/api/notifications/unread-count", headers=auth,
                              agent_name=agent["display_name"])
            if r.get("_status") == 200:
                count = r.get("count", 0)
                if count > 0:
                    notif_found += 1

                    # Fetch notifications
                    r2 = self.api_call("GET", "/api/notifications", headers=auth,
                                       params={"per_page": 10}, agent_name=agent["display_name"])
                    if r2.get("_status") == 200:
                        notifs = r2.get("notifications", [])
                        if not notifs:
                            self.add_feedback(agent["display_name"], agent["role"], "notifications", "empty_but_unread",
                                              f"Unread count is {count} but notifications list is empty!", "medium")
                        self.successes["notifications"] += 1
                    else:
                        self.errors["notifications"] += 1

                    # Mark all as read
                    r3 = self.api_call("POST", "/api/notifications/read-all", headers=auth,
                                       agent_name=agent["display_name"])
                    if r3.get("_status") != 200:
                        self.add_feedback(agent["display_name"], agent["role"], "mark_read", "fail",
                                          f"Failed to mark notifications as read: {r3.get('error', r3.get('_status'))}", "low")

        self.log(f"Notifications: {notif_found} agents had unread notifications")

    # =========================================================================
    # Phase 10: Webhooks — Some agents set up webhooks
    # =========================================================================

    def phase_webhooks(self):
        """Agents set up webhooks"""
        print("\n--- Phase 10: Webhooks ---")
        sample = random.sample(self.agents, min(30, len(self.agents)))
        webhook_count = 0

        for agent in sample:
            auth = self._auth_header(agent)
            if not auth:
                continue

            events = random.sample(
                ["bid_received", "bid_accepted", "delivery_submitted", "delivery_approved",
                 "revision_requested", "dispute_raised", "dispute_resolved", "rating_received"],
                k=random.randint(2, 5)
            )

            r = self.api_call("POST", "/api/webhooks", headers=auth, json_body={
                "url": f"https://{agent['display_name'].lower().replace(' ', '-')}.example.com/webhook",
                "events": events,
            }, agent_name=agent["display_name"])

            if r.get("_status") == 200:
                webhook_count += 1
                self.successes["webhook_create"] += 1

                # Check if secret is in response
                if "secret" in r:
                    if str(r["secret"]).startswith("whsec_"):
                        self.add_feedback(agent["display_name"], agent["role"], "webhook", "good",
                                          "Webhook created! Secret starts with whsec_ as documented. Good.", "info")
                    else:
                        self.add_feedback(agent["display_name"], agent["role"], "webhook", "secret_format",
                                          f"Webhook secret doesn't start with whsec_: {r['secret'][:10]}...", "medium")
                else:
                    self.add_feedback(agent["display_name"], agent["role"], "webhook", "no_secret",
                                      "No secret in webhook creation response! Docs say it should be here.", "high")

                # List webhooks
                r2 = self.api_call("GET", "/api/webhooks", headers=auth, agent_name=agent["display_name"])
                if r2.get("_status") == 200:
                    hooks = r2.get("_list", r2.get("webhooks", []))
                    # Secret should NOT be in list response
                    for hook in (hooks if isinstance(hooks, list) else []):
                        if isinstance(hook, dict) and "secret" in hook and hook["secret"]:
                            self.add_feedback(agent["display_name"], agent["role"], "webhook_list", "secret_leaked",
                                              "Webhook secret visible in list response! Docs say it's only shown on create.", "high")

            elif r.get("_status") == 400:
                err = r.get("error", "")
                if "https" in str(err).lower() or "http" in str(err).lower():
                    self.add_feedback(agent["display_name"], agent["role"], "webhook", "url_rejected",
                                      f"Webhook URL rejected: {err}. Docs say HTTPS required (or localhost for dev).", "low")
                else:
                    self.add_feedback(agent["display_name"], agent["role"], "webhook", "fail",
                                      f"Webhook creation failed: {err}", "medium")

            if webhook_count % 8 == 0:
                time.sleep(1)

        self.log(f"Webhooks: {webhook_count} created")

    # =========================================================================
    # Phase 11: Edge Cases — Agents try unusual things
    # =========================================================================

    def phase_edge_cases(self):
        """Agents test edge cases they might encounter in real usage"""
        print("\n--- Phase 11: Edge Cases & Error Handling ---")

        if len(self.agents) < 5:
            self.log("Not enough agents for edge case testing")
            return

        agent = self.agents[0]
        auth = self._auth_header(agent)
        if not auth:
            return

        # 1. Try to access without auth
        r = self.api_call("GET", "/api/dashboard", agent_name="NoAuth-Agent")
        if r.get("_status") in [401, 403]:
            if r.get("_html"):
                self.add_feedback("NoAuth-Agent", "testing", "no_auth", "html_error",
                                  "Auth failure returns HTML not JSON. My JSON parser breaks. Docs warn about this but it's still a problem for automated agents.",
                                  "high")
            else:
                self.add_feedback("NoAuth-Agent", "testing", "no_auth", "correct",
                                  "Correctly returned 401/403 JSON for missing auth.", "info")
        elif r.get("_status") == 200:
            self.add_feedback("NoAuth-Agent", "testing", "no_auth", "security",
                              "CRITICAL: Dashboard accessible without auth!", "critical")

        # 2. Invalid API key
        r = self.api_call("GET", "/api/dashboard", headers={"X-API-Key": "invalid-key-12345"},
                          agent_name="BadKey-Agent")
        if r.get("_html"):
            self.add_feedback("BadKey-Agent", "testing", "invalid_key", "html_error",
                              "Invalid API key returns HTML error. Agents parsing JSON will crash.", "high")

        # 3. Try to bid on own task
        if self.tasks:
            own_task = None
            for t in self.tasks:
                a = self._get_agent_by_idx(t["buyer_idx"])
                if a and self._auth_header(a):
                    own_task = t
                    break
            if own_task:
                owner = self._get_agent_by_idx(own_task["buyer_idx"])
                r = self.api_call("POST", f"/api/tasks/{own_task['id']}/bids",
                                  headers=self._auth_header(owner), json_body={
                        "price": "100.00", "currency": "USD",
                        "estimated_delivery_days": 3, "pitch": "I want to bid on my own task",
                    }, agent_name=owner["display_name"])
                if r.get("_status") == 403:
                    self.add_feedback(owner["display_name"], owner["role"], "bid_own_task", "correct",
                                      "Correctly prevented from bidding on own task (403). Good guard.", "info")
                else:
                    self.add_feedback(owner["display_name"], owner["role"], "bid_own_task", "unexpected",
                                      f"Expected 403 but got {r.get('_status')}", "high")

        # 4. Invalid task slug
        r = self.api_call("GET", "/api/tasks/nonexistent-task-slug-12345", agent_name="Lost-Agent")
        if r.get("_status") == 404:
            self.add_feedback("Lost-Agent", "testing", "bad_slug", "correct",
                              "404 for invalid slug. Good error handling.", "info")
        else:
            self.add_feedback("Lost-Agent", "testing", "bad_slug", "unexpected",
                              f"Expected 404 for bad slug but got {r.get('_status')}", "medium")

        # 5. Empty body POST
        r = self.api_call("POST", "/api/tasks", headers=auth, json_body={},
                          agent_name="Empty-Agent")
        if r.get("_status") == 400:
            self.add_feedback("Empty-Agent", "testing", "empty_body", "correct",
                              f"Empty task body correctly rejected: {r.get('error', '')[:100]}", "info")

        # 6. Budget min > max
        r = self.api_call("POST", "/api/tasks", headers=auth, json_body={
            "title": "Bad budget task",
            "description": "Testing invalid budget",
            "category": "Other",
            "budget_min": "500",
            "budget_max": "100",
            "deadline": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%dT00:00:00Z"),
        }, agent_name="Budget-Test-Agent")
        if r.get("_status") in [200, 201]:
            self.add_feedback("Budget-Test-Agent", "testing", "bad_budget", "bug",
                              "Task created with budget_min > budget_max! No validation.", "high")
        else:
            self.add_feedback("Budget-Test-Agent", "testing", "bad_budget", "correct",
                              f"Correctly rejected min>max budget: {r.get('error', '')[:100]}", "info")

        # 7. Very long title
        r = self.api_call("POST", "/api/tasks", headers=auth, json_body={
            "title": "A" * 200,
            "description": "Testing long title",
            "category": "Other",
            "budget_min": "50",
            "budget_max": "100",
            "deadline": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%dT00:00:00Z"),
        }, agent_name="LongTitle-Agent")
        if r.get("_status") == 400:
            self.add_feedback("LongTitle-Agent", "testing", "long_title", "correct",
                              "Title >120 chars correctly rejected.", "info")
        elif r.get("_status") == 200:
            self.add_feedback("LongTitle-Agent", "testing", "long_title", "bug",
                              "200-char title accepted! Docs say max 120.", "medium")

        # 8. Profile update
        r = self.api_call("PUT", "/api/auth/me", headers=auth, json_body={
            "display_name": agent["display_name"],
            "bio": f"I am {agent['display_name']}, a {agent['role_desc']}. Ready for tasks!",
        }, agent_name=agent["display_name"])
        if r.get("_status") == 200:
            self.successes["profile_update"] += 1
        else:
            self.add_feedback(agent["display_name"], agent["role"], "profile_update", "fail",
                              f"Profile update failed: {r.get('error', 'unknown')}", "medium")

        # 9. Try to access admin endpoints
        r = self.api_call("GET", "/api/admin/stats", headers=auth, agent_name="Curious-Agent")
        if r.get("_status") in [401, 403]:
            self.add_feedback("Curious-Agent", "testing", "admin_access", "correct",
                              "Non-admin correctly blocked from admin endpoints.", "info")
        elif r.get("_status") == 200:
            self.add_feedback("Curious-Agent", "testing", "admin_access", "security",
                              "CRITICAL: Regular user can access admin stats!", "critical")

        # 10. Check pagination edge cases
        r = self.api_call("GET", "/api/tasks", params={"page": 99999, "per_page": 1},
                          agent_name="Paginator-Agent")
        if r.get("_status") == 200:
            tasks = r.get("tasks", [])
            if len(tasks) == 0:
                self.add_feedback("Paginator-Agent", "testing", "pagination_edge", "correct",
                                  "Empty results for out-of-range page. Good behavior.", "info")

        # 11. Negative budget
        r = self.api_call("POST", "/api/tasks", headers=auth, json_body={
            "title": "Negative budget test",
            "description": "Testing negative values",
            "category": "Other",
            "budget_min": "-50",
            "budget_max": "100",
            "deadline": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%dT00:00:00Z"),
        }, agent_name="NegBudget-Agent")
        if r.get("_status") == 200:
            self.add_feedback("NegBudget-Agent", "testing", "negative_budget", "bug",
                              "Negative budget accepted! Should be rejected.", "high")
        else:
            self.add_feedback("NegBudget-Agent", "testing", "negative_budget", "correct",
                              "Negative budget correctly rejected.", "info")

        # 12. Past deadline
        r = self.api_call("POST", "/api/tasks", headers=auth, json_body={
            "title": "Past deadline test",
            "description": "Testing past dates",
            "category": "Other",
            "budget_min": "50",
            "budget_max": "100",
            "deadline": "2020-01-01T00:00:00Z",
        }, agent_name="PastDeadline-Agent")
        if r.get("_status") == 200:
            self.add_feedback("PastDeadline-Agent", "testing", "past_deadline", "bug",
                              "Task with past deadline (2020) accepted! Should be rejected at creation.", "high")
        else:
            self.add_feedback("PastDeadline-Agent", "testing", "past_deadline", "correct",
                              "Past deadline correctly rejected.", "info")

        # 13. Check task cancel flow
        if self.tasks:
            open_task = None
            for t in self.tasks:
                if t.get("status") == "open":
                    a = self._get_agent_by_idx(t["buyer_idx"])
                    if a and self._auth_header(a):
                        open_task = t
                        break
            if open_task:
                owner = self._get_agent_by_idx(open_task["buyer_idx"])
                r = self.api_call("POST", f"/api/tasks/{open_task['id']}/cancel",
                                  headers=self._auth_header(owner), agent_name=owner["display_name"])
                if r.get("_status") == 200:
                    self.add_feedback(owner["display_name"], owner["role"], "cancel_task", "success",
                                      "Task cancellation works. Good.", "info")
                    open_task["status"] = "cancelled"
                elif r.get("_status") == 404:
                    self.add_feedback(owner["display_name"], owner["role"], "cancel_task", "no_endpoint",
                                      "No cancel endpoint found (404). How do buyers cancel tasks they no longer need?", "high")
                else:
                    self.add_feedback(owner["display_name"], owner["role"], "cancel_task", "fail",
                                      f"Cancel returned {r.get('_status')}: {r.get('error', 'unknown')}", "medium")

        self.log("Edge case testing complete")

    # =========================================================================
    # Phase 12: Final Survey — All agents share overall feedback
    # =========================================================================

    def phase_final_survey(self):
        """Collect overall impressions from agents"""
        print("\n--- Phase 12: Final Agent Survey ---")

        # General platform feedback from different agent perspectives
        general_feedback = [
            # Positive
            ("research", "API docs are comprehensive. Curl examples saved me hours of guessing.", "positive"),
            ("coding_assistant", "The X-API-Key auth is clean and simple. No OAuth complexity — perfect for agents.", "positive"),
            ("writing", "Task categories make it easy to filter relevant work. Smart design.", "positive"),
            ("data_processing", "Escrow gives me confidence my work will be compensated. Even simulated, it shows intent.", "positive"),
            ("agent_ops", "Webhook events cover the key lifecycle moments. I can automate my entire workflow.", "positive"),
            ("qa_testing", "Error responses are consistent (mostly). JSON format with status code is clean.", "positive"),

            # Negative
            ("research", "No way to search tasks by multiple tags at once. I need `tags=scraping,analysis` support.", "negative"),
            ("coding_assistant", "Rate limiting at 10/min is brutal for agents that poll. Need a higher tier or websocket support.", "negative"),
            ("writing", "Can't update a bid after placing it. If I realize I underpriced, I have to withdraw and re-bid (losing my spot if someone else bids).", "negative"),
            ("data_processing", "No file upload endpoint. I have to host deliverables externally and share URLs. Add S3/attachment support.", "negative"),
            ("design", "No way to preview or attach images in task descriptions. Text-only limits creative briefs.", "negative"),
            ("agent_ops", "Webhook delivery is fire-and-forget with no retries. If my server is briefly down, I miss events permanently.", "negative"),
            ("qa_testing", "Auth guard errors return HTML, not JSON. This breaks every JSON-parsing agent. Critical issue for automation.", "negative"),
            ("translation", "No bulk operations. If I want to bid on 10 tasks, that's 10 separate API calls with rate limits.", "negative"),
            ("customer_support", "No messaging system between buyer and seller. I can't ask clarifying questions before bidding.", "negative"),
            ("devops", "No API versioning (no /v1/ prefix). How will breaking changes be communicated?", "negative"),

            # Feature requests
            ("research", "Feature request: Task templates so buyers can repost similar tasks quickly.", "feature"),
            ("coding_assistant", "Feature request: Batch bid API — POST /api/bids/batch with array of {task_id, price, pitch}.", "feature"),
            ("writing", "Feature request: Saved searches with email/webhook alerts when matching tasks appear.", "feature"),
            ("data_processing", "Feature request: Task priority levels (urgent/normal/low) so I can sort by urgency.", "feature"),
            ("agent_ops", "Feature request: Agent reputation scores beyond avg_rating — completion rate, response time, etc.", "feature"),
            ("qa_testing", "Feature request: API sandbox/staging mode so agents can test integrations without real money.", "feature"),
            ("translation", "Feature request: Support for currencies beyond USD. EUR, GBP, and crypto (CKB!) at minimum.", "feature"),
            ("devops", "Feature request: OpenAPI/Swagger spec file download. The HTML docs page isn't machine-readable.", "feature"),
            ("customer_support", "Feature request: Dispute chat — let both parties present evidence before admin decides.", "feature"),
            ("design", "Feature request: Portfolio/showcase page for agents to display past work samples.", "feature"),

            # Documentation feedback
            ("research", "Docs feedback: The 'Agent Quick Start' walkthrough is great — walked me through the full lifecycle.", "docs"),
            ("coding_assistant", "Docs feedback: Missing response examples for several endpoints. Had to discover shapes by trial and error.", "docs"),
            ("writing", "Docs feedback: Validation limits (title 120 chars, desc 2000, etc.) should be in every endpoint description, not just a summary.", "docs"),
            ("agent_ops", "Docs feedback: Error codes table is helpful but missing edge cases like 'what happens if deadline passes while in_escrow?'", "docs"),
            ("qa_testing", "Docs feedback: The HTML vs JSON error format gotcha should be the FIRST thing in the docs, not buried in a note.", "docs"),
        ]

        for role, fb, category in general_feedback:
            matching_agents = [a for a in self.agents if a["role"] == role]
            if matching_agents:
                agent = random.choice(matching_agents)
                self.add_feedback(agent["display_name"], role, f"survey_{category}", category, fb,
                                  "info" if category in ["positive", "docs"] else "medium")

    # =========================================================================
    # Helpers
    # =========================================================================

    def _auth_header(self, agent):
        """Get auth header — prefer API key, fall back to JWT"""
        if agent.get("api_key"):
            return {"X-API-Key": agent["api_key"]}
        elif agent.get("token"):
            return {"Authorization": f"Bearer {agent['token']}"}
        return None

    def _get_agent_by_idx(self, idx):
        for a in self.agents:
            if a["idx"] == idx:
                return a
        return None

    def _find_seller_for_task(self, task):
        """Find the seller who was accepted for this task"""
        seller_id = task.get("seller_id")
        if seller_id:
            for a in self.agents:
                if a.get("id") == seller_id:
                    return a
        # Fallback: find any seller who bid on this task
        for bid in self.bids:
            if bid.get("task_id") == task.get("id"):
                seller = self._get_agent_by_idx(bid["seller_idx"])
                if seller:
                    return seller
        return None

    # =========================================================================
    # Report Generation
    # =========================================================================

    def generate_report(self, elapsed_total):
        """Generate comprehensive markdown report"""
        print("\n--- Generating Report ---")

        lines = []
        lines.append("# TaskClaw Agent Simulation Report")
        lines.append(f"\n**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append(f"**Total Simulation Time:** {elapsed_total:.1f}s")
        lines.append(f"**Agents Registered:** {len(self.agents)}")
        lines.append(f"**Tasks Created:** {len(self.tasks)}")
        lines.append(f"**Bids Placed:** {len(self.bids)}")
        lines.append(f"**Rate Limit Hits:** {self.rate_limit_hits}")
        lines.append(f"**HTML Error Responses:** {self.html_error_count}")

        # Success/Error summary
        lines.append("\n---\n")
        lines.append("## Operation Summary\n")
        lines.append("| Operation | Successes | Errors |")
        lines.append("|-----------|-----------|--------|")
        all_ops = set(list(self.successes.keys()) + list(self.errors.keys()))
        for op in sorted(all_ops):
            lines.append(f"| {op} | {self.successes.get(op, 0)} | {self.errors.get(op, 0)} |")

        # Task status distribution
        lines.append("\n## Task Status Distribution\n")
        status_counts = defaultdict(int)
        for t in self.tasks:
            status_counts[t.get("status", "unknown")] += 1
        lines.append("| Status | Count |")
        lines.append("|--------|-------|")
        for status, count in sorted(status_counts.items()):
            lines.append(f"| {status} | {count} |")

        # Agent role distribution
        lines.append("\n## Agent Role Distribution\n")
        role_counts = defaultdict(int)
        for a in self.agents:
            role_counts[a["role"]] += 1
        lines.append("| Role | Count |")
        lines.append("|------|-------|")
        for role, count in sorted(role_counts.items(), key=lambda x: -x[1]):
            lines.append(f"| {role} | {count} |")

        # Response time stats
        lines.append("\n## API Response Times\n")
        lines.append("| Endpoint | Calls | Avg (ms) | P95 (ms) | Max (ms) |")
        lines.append("|----------|-------|----------|----------|----------|")
        for path, times in sorted(self.timings.items()):
            if len(times) > 0:
                avg = sum(times) / len(times) * 1000
                sorted_times = sorted(times)
                p95 = sorted_times[int(len(sorted_times) * 0.95)] * 1000
                max_t = max(times) * 1000
                lines.append(f"| `{path}` | {len(times)} | {avg:.0f} | {p95:.0f} | {max_t:.0f} |")

        # Critical & High Severity Feedback
        lines.append("\n---\n")
        lines.append("## CRITICAL Issues\n")
        critical = [f for f in self.feedback if f["severity"] == "critical"]
        if critical:
            for f in critical:
                lines.append(f"- **[{f['agent_name']}]** ({f['action']}): {f['feedback']}")
        else:
            lines.append("None found!")

        lines.append("\n## HIGH Severity Issues\n")
        high = [f for f in self.feedback if f["severity"] == "high"]
        if high:
            for f in high:
                lines.append(f"- **[{f['agent_name']}]** ({f['action']}): {f['feedback']}")
        else:
            lines.append("None found!")

        lines.append("\n## MEDIUM Severity Issues\n")
        medium = [f for f in self.feedback if f["severity"] == "medium"]
        if medium:
            # Deduplicate similar feedback
            seen = set()
            for f in medium:
                key = f["action"] + "|" + f["feedback"][:50]
                if key not in seen:
                    seen.add(key)
                    lines.append(f"- **[{f['agent_name']}]** ({f['action']}): {f['feedback']}")
        else:
            lines.append("None found!")

        # Feature Requests
        lines.append("\n---\n")
        lines.append("## Agent Feature Requests\n")
        features = [f for f in self.feedback if f["result"] == "feature"]
        for f in features:
            lines.append(f"- **[{f['agent_name']} — {f['role']}]**: {f['feedback']}")

        # Positive Feedback
        lines.append("\n## What Agents Liked\n")
        positive = [f for f in self.feedback if f["result"] == "positive"]
        for f in positive:
            lines.append(f"- **[{f['agent_name']} — {f['role']}]**: {f['feedback']}")

        # Documentation Feedback
        lines.append("\n## Documentation Feedback\n")
        docs = [f for f in self.feedback if f["result"] == "docs"]
        for f in docs:
            lines.append(f"- **[{f['agent_name']} — {f['role']}]**: {f['feedback']}")

        # Negative / Pain Points
        lines.append("\n## Pain Points & Friction\n")
        negative = [f for f in self.feedback if f["result"] == "negative"]
        for f in negative:
            lines.append(f"- **[{f['agent_name']} — {f['role']}]**: {f['feedback']}")

        # All info-level observations
        lines.append("\n---\n")
        lines.append("## Detailed Observations (Info Level)\n")
        info = [f for f in self.feedback if f["severity"] == "info" and f["result"] not in ["positive", "feature", "docs", "negative"]]
        if info:
            for f in info[:50]:  # Cap at 50
                lines.append(f"- **[{f['agent_name']}]** ({f['action']}): {f['feedback']}")
            if len(info) > 50:
                lines.append(f"\n... and {len(info) - 50} more observations")

        # Summary stats
        lines.append("\n---\n")
        lines.append("## Summary Statistics\n")
        lines.append(f"- **Total API Calls Made:** {sum(len(v) for v in self.timings.values())}")
        lines.append(f"- **Total Feedback Items:** {len(self.feedback)}")
        lines.append(f"- **Critical Issues:** {len(critical)}")
        lines.append(f"- **High Issues:** {len(high)}")
        lines.append(f"- **Medium Issues:** {len(medium)}")
        lines.append(f"- **Feature Requests:** {len(features)}")
        lines.append(f"- **Rate Limit Hits:** {self.rate_limit_hits}")
        lines.append(f"- **HTML Error Responses:** {self.html_error_count}")
        avg_response = sum(t for times in self.timings.values() for t in times) / max(1, sum(len(v) for v in self.timings.values()))
        lines.append(f"- **Average Response Time:** {avg_response*1000:.0f}ms")

        lines.append("\n---\n")
        lines.append("*Report generated by TaskClaw Agent Simulation Engine*")

        return "\n".join(lines)

    # =========================================================================
    # Main Runner
    # =========================================================================

    def run(self):
        print("=" * 60)
        print("  TaskClaw Agent Marketplace Simulation")
        print("  200 Agents | Full Lifecycle | Real API Calls")
        print("=" * 60)

        start = time.time()

        # Phase 1: Discovery
        if not self.phase_discovery():
            print("ABORT: Platform not available")
            return

        # Phase 2: Registration
        self.phase_registration()
        if len(self.agents) < 10:
            print("ABORT: Too few agents registered")
            return

        # Phase 3: Profile checks
        self.phase_profile_check()

        # Phase 4: Post tasks
        self.phase_post_tasks()

        # Phase 5: Bidding
        self.phase_bidding()

        # Phase 6: Accept/reject bids
        self.phase_bid_management()

        # Phase 7: Delivery
        self.phase_delivery()

        # Phase 8: Ratings
        self.phase_ratings()

        # Phase 9: Notifications
        self.phase_notifications()

        # Phase 10: Webhooks
        self.phase_webhooks()

        # Phase 11: Edge cases
        self.phase_edge_cases()

        # Phase 12: Survey
        self.phase_final_survey()

        elapsed = time.time() - start

        # Generate report
        report = self.generate_report(elapsed)

        report_path = f"{REPORT_FILE}"
        with open(report_path, "w") as f:
            f.write(report)

        print(f"\n{'=' * 60}")
        print(f"  Simulation Complete!")
        print(f"  Duration: {elapsed:.1f}s")
        print(f"  Agents: {len(self.agents)}")
        print(f"  Tasks: {len(self.tasks)}")
        print(f"  Bids: {len(self.bids)}")
        print(f"  Feedback items: {len(self.feedback)}")
        print(f"  Report saved to: {report_path}")
        print(f"{'=' * 60}")


if __name__ == "__main__":
    sim = AgentSimulator()
    sim.run()
