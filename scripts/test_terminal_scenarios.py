import sys
import json
import requests
import time

BASE_URL = "http://localhost:8000/api"

TEST_CASES = [
    {
        "domain": "IT / Cybersecurity",
        "title": "Hardware Token Loss & 2FA Bypass + Critical Ticket",
        "query": "I lost my YubiKey hardware token while traveling and cannot complete 2FA for Okta and AWS VPN. Can you explain the emergency bypass procedure and raise a critical priority ticket for IT security?"
    },
    {
        "domain": "HR / Time-Off",
        "title": "Sick Leave Application & Medical Certificate Policy",
        "query": "I have severe flu symptoms and need to take medical leave from next Monday to Wednesday. Do I need to submit a doctor's certificate according to our leave policy, and please file the sick leave for me?"
    },
    {
        "domain": "Finance / Expense Claims",
        "title": "Client Entertainment Meal & Alcohol Cap Check + Reimbursement",
        "query": "During my client meeting in Bangalore yesterday, I paid 8400 INR for dinner with 4 enterprise clients. Is alcohol covered under the meal policy, and please file an expense reimbursement claim for 8400 INR under Meals?"
    },
    {
        "domain": "Facilities / Office Ops",
        "title": "VIP Executive Visitor Security Clearance & Parking Inquiry",
        "query": "Our enterprise partner Rajesh Kumar from Infosys is visiting our campus tomorrow from 10 AM to 1 PM for an executive architecture review. Can you issue his security guest pass and tell me where visitor parking is located?"
    },
    {
        "domain": "HR / Talent Acquisition",
        "title": "Senior Candidate Referral & Referral Bonus Eligibility Timeline",
        "query": "I want to refer Amit Saxena (amit.saxena@gmail.com) for the Senior Cloud Architect role. When is the employee referral bonus paid out according to policy, and submit this referral to the hiring team?"
    }
]

def run_tests():
    print("=" * 80)
    print("🚀 ONEDESK AI - COMPREHENSIVE TERMINAL AGENTIC & RAG TEST SUITE")
    print("=" * 80)
    
    results = []

    for idx, test in enumerate(TEST_CASES, 1):
        print(f"\n[{idx}/5] 🧪 TESTING DOMAIN: {test['domain']}")
        print(f"📌 Scenario: {test['title']}")
        print(f"💬 Query: \"{test['query']}\"")
        print("-" * 80)
        
        t0 = time.time()
        try:
            resp = requests.post(
                f"{BASE_URL}/query",
                json={
                    "query": test["query"],
                    "employee_id": "EMP001",
                    "user_name": "Vipul Jain",
                    "department": "Product Engineering"
                },
                timeout=35
            )
            elapsed = time.time() - t0
            
            if resp.status_code != 200:
                print(f"❌ Query failed with status {resp.status_code}: {resp.text}")
                continue
                
            data = resp.json()
            domain = data.get("domain", "Unknown")
            confidence = data.get("confidence", 0.0)
            answer = data.get("answer", "")
            sources = data.get("sources", [])
            action_proposal = data.get("action_proposal")
            
            print(f"⏱️ Response Time: {elapsed:.2f}s | Classified Domain: {domain} ({confidence*100:.1f}%)")
            print(f"\n📖 AI Answer Summary:\n{answer}")
            
            print(f"\n📚 RAG Sources Retrieved ({len(sources)} docs):")
            for s in sources[:2]:
                print(f"   • [{s.get('domain', 'Doc')}] {s.get('filename')} (Score: {s.get('score', 0):.3f})")
                
            if action_proposal:
                act_type = action_proposal.get("action_type")
                act_name = action_proposal.get("display_name")
                details = action_proposal.get("details", {})
                print(f"\n⚡ Agentic Action Proposed: {act_name} ({act_type})")
                print(f"   Extracted Parameters: {json.dumps(details, indent=5)}")
                
                # Test the execution via confirm-action
                print(f"\n🤖 Simulating User Confirmation -> Executing Action in Database...")
                conf_resp = requests.post(
                    f"{BASE_URL}/confirm-action",
                    json={
                        "action_type": act_type,
                        "details": details
                    },
                    timeout=15
                )
                if conf_resp.status_code == 200:
                    conf_data = conf_resp.json()
                    print(f"   ✅ Execution Success: {conf_data.get('message', 'Done')}")
                    results.append({"domain": test["domain"], "status": "SUCCESS", "action": act_type, "time": f"{elapsed:.1f}s"})
                else:
                    print(f"   ⚠️ Confirm failed: {conf_resp.text}")
                    results.append({"domain": test["domain"], "status": "CONFIRM_FAILED", "action": act_type, "time": f"{elapsed:.1f}s"})
            else:
                print(f"\n⚠️ No Action Proposal generated.")
                results.append({"domain": test["domain"], "status": "NO_ACTION", "action": None, "time": f"{elapsed:.1f}s"})
                
        except Exception as e:
            print(f"❌ Error during execution: {e}")
            results.append({"domain": test["domain"], "status": f"ERROR: {e}", "action": None, "time": "N/A"})
            
        print("=" * 80)
        time.sleep(1)

    print("\n🏁 FINAL TEST SUMMARY TABLE:")
    print("-" * 80)
    print(f"{'Domain':<28} | {'Status':<12} | {'Action':<22} | {'Latency':<8}")
    print("-" * 80)
    for r in results:
        print(f"{r['domain']:<28} | {r['status']:<12} | {str(r['action']):<22} | {r['time']:<8}")
    print("-" * 80)

if __name__ == "__main__":
    run_tests()
