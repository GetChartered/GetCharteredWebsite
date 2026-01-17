import Link from "next/link";

export default function Footer(){
    return (
        <div>
            <Link
                href="/faq"
            >
                FAQ
            </Link>
            <br></br>
            <Link
                href="/contact"
            >
                Contact Us
            </Link>
            <br></br>
            <Link
                href="/privacypolicy.html"
            >
                Privacy Policy
            </Link>
            <br></br>
            <Link
                href="/terms.html"
            >
                Terms and conditions
            </Link>
            <br></br>
            <p>&copy; 2025, GetChartered</p>
        </div>
    );
}