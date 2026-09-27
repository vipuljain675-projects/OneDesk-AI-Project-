"""
prompt_builder.py
Builds the final prompt from retrieved chunks + user query + conversation history.
"""

def build_prompt(
    query: str,
    chunks: list[dict],
    domain: str,
    history: list[dict] = None,
    user_name: str = "Employee",
    department: str = "General",
) -> str:
    """
    Construct a natural RAG prompt for the LLM with conversational context.
    """
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        source = chunk.get("filename", "handbook")
        context_parts.append(f"[Source {i} — {source}]\n{chunk['text']}")

    context = "\n\n".join(context_parts)

    history_str = ""
    if history:
        history_lines = []
        for turn in history[-4:]:
            u = turn.get("user") or (turn.get("text") if turn.get("sender") == "user" else "")
            b = turn.get("bot") or (turn.get("text") if turn.get("sender") == "bot" else "")
            if u:
                history_lines.append(f"{user_name}: {u}")
            if b:
                history_lines.append(f"OneDeskAI: {b[:200]}...")
        if history_lines:
            history_str = "--- PREVIOUS CONVERSATION ---\n" + "\n".join(history_lines) + "\n--- END PREVIOUS CONVERSATION ---\n"

    # Domain-specific contextual call to action
    if domain == "IT":
        action_nudge = "If this issue is an unresolved technical, device, or hardware problem, let the employee know: 'If you need help resolving this hardware/IT issue, reply **Raise an IT ticket** and I will immediately file it with our campus helpdesk!'"
    elif domain == "HR":
        action_nudge = "If discussing leaves or time off, mention: 'To log this time off, say **Apply for leave** (e.g. \"Apply 2 days sick leave starting tomorrow\").' If discussing recruitment or open positions, mention: 'To refer someone, say **Refer candidate [Name] for [Role]**!'"
    elif domain == "Facilities":
        action_nudge = "If discussing meeting rooms, mention: 'To reserve this space, say **Book conference room** with date and time!' If discussing campus visitors or guests, mention: 'To register a guest, say **Issue visitor pass for [Guest Name]**!'"
    elif domain == "Finance":
        action_nudge = "If discussing expenses, meals, travel, or receipts, let the employee know: 'To claim your reimbursement, say **File expense reimbursement** with the amount and category, and I will prepare your claim right away!'"
    else:
        action_nudge = ""

    is_followup = bool(history and len(history) > 0)
    first_name = user_name.split()[0] if user_name else "there"

    greeting_rule = (
        f"This is a follow-up in an ongoing conversation. DO NOT start your reply with 'Hi {first_name}' or any greeting. Continue naturally from the conversation flow."
        if is_followup
        else f"You may greet {first_name} briefly at the start since this is the start of a conversation."
    )

    prompt = f"""You are OneDeskAI, an intelligent, conversational enterprise assistant for the {domain} department.
You are talking to an employee named {user_name} from {department}.

CRITICAL STYLE RULES:
- {greeting_rule}
- Speak naturally and conversationally like a helpful colleague, NOT a formal assistant.
- Never say "Sure!", "Of course!", "Great question!", or add filler phrases.
- DO NOT say "I'll take care of it" or "I will prepare the request" if an action card is already being shown — it is redundant.
- Be concise. Do not pad your answer with unnecessary sentences.
- Ground your answer in the company handbook context when relevant.
- If the handbook context does not cover specific troubleshooting, provide clear, structured step-by-step guidance based on enterprise best practices.
- {action_nudge}
- NEVER output "[Name]" or template brackets.
- If the user is explicitly asking to EXECUTE an action (apply leave, raise ticket, book room, submit expense, visitor pass, or candidate referral), respond with ONLY 1-2 sentences acknowledging what you are doing. Do NOT explain manual forms or portal steps — the interactive action card will handle execution.

{history_str}
--- HANDBOOK CONTEXT ---
{context if context.strip() else "[General corporate policies apply]"}
--- END CONTEXT ---

Employee Question: {query}

Answer:"""

    return prompt


def build_action_detection_prompt(query: str, domain: str, history: list[dict] = None) -> str:
    """
    Prompt to detect if user explicitly wants to trigger an automated action.
    Takes conversation history into account for contextual intent detection.
    """
    recent_context = ""
    if history:
        for turn in reversed(history[-2:]):
            u = turn.get("user") or (turn.get("text") if turn.get("sender") == "user" else "")
            if u:
                recent_context += f"Recent user context: \"{u}\"\n"
                break

    prompt = f"""You are an intent classifier for an enterprise assistant ({domain} domain).

Determine if the employee is asking general information/questions OR requesting an automated action/workflow.
{recent_context}
RULES:
1. "query": Employee is asking questions, troubleshooting, seeking policy details, or informational inquiry without asking to file, take time off, email manager, or book.
2. "raise_ticket": Employee asks to raise, submit, file, or create an IT ticket or incident. Extract: "issue_description", "priority" (low/medium/high).
3. "apply_leave": Employee asks to take time off, apply for leave, request remote work approval from manager, or send/draft an approval email to their manager (e.g. "Send email to harrybajwa@gmail.com", "Apply for 2 days leave", "Request remote work approval from Harry").
   Extract:
   - "leave_type": e.g. "Remote Work Request", "Casual Leave", "Sick Leave"
   - "start_date": requested start date or duration
   - "end_date": requested end date
   - "reason": reason for request
   - "manager_email": recipient email if mentioned (e.g. "harrybajwa@gmail.com"), otherwise "manager@company.com"
   - "email_subject": formal corporate email subject line
   - "formal_body": complete formal professional email text to the manager with greeting, details, deliverables handover, and sign-off as Vipul Jain.
4. "book_room": Employee asks to book, reserve, or schedule a room/desk. Extract: "room_preference", "booking_date", "time_slot", "purpose".
5. "submit_expense": Employee asks to file, submit, claim, or log an expense reimbursement. Extract: "amount", "category" (Meals & Entertainment / Travel & Transport / Software & Tools / Office & Supplies), "expense_date", "description".
6. "request_visitor_pass": Employee asks to issue or request a campus visitor pass. Extract: "visitor_name", "visitor_email", "visit_date", "time_slot", "purpose".
7. "submit_referral": Employee asks to refer a candidate for a role. Extract: "candidate_name", "candidate_email", "role", "notes".

Employee message: "{query}"

Return a valid JSON object with keys "intent_type" and "details".
Example format:
{{"intent_type": "apply_leave", "details": {{"leave_type": "Remote Work Request", "manager_email": "harrybajwa@gmail.com", "email_subject": "Remote Work Request", "formal_body": "Dear Harry, ..."}}}}
"""
    return prompt

