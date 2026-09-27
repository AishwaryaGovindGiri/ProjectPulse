import { useState } from "react";
import {
    Mail,
    UserPlus,
    Check,
    ChevronDown,
    User,
} from "lucide-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const API_URL = "http://localhost:5000/api";

const AVATAR_STYLES = [
    "adventurer",
    "adventurer-neutral",
    "avataaars",
    "big-ears",
    "big-ears-neutral",
    "bottts",
    "croodles",
    "fun-emoji",
    "lorelei",
    "micah",
    "miniavs",
    "notionists",
    "open-peeps",
    "personas",
    "pixel-art",
];

const AVATAR_SEEDS = [
    "Alex",
    "Aarav",
    "Aisha",
    "Arjun",
    "Ava",
    "Benjamin",
    "Charlotte",
    "Daniel",
    "Diya",
    "Ethan",
    "Emma",
    "Farhan",
    "Grace",
    "Harper",
    "Ishaan",
    "Isabella",
    "Jack",
    "James",
    "Kabir",
    "Kavya",
    "Leo",
    "Liam",
    "Maya",
    "Meera",
    "Noah",
    "Olivia",
    "Priya",
    "Rahul",
    "Riya",
    "Ryan",
    "Sara",
    "Sophia",
    "Tanvi",
    "Thomas",
    "Vihaan",
    "William",
    "Yash",
    "Zara",
    "Aditya",
    "Ananya",
    "Aryan",
    "Ira",
    "Karan",
    "Kiara",
    "Manav",
    "Neha",
    "Rohan",
    "Saanvi",
    "Shreya",
    "Varun",
];

const generateAvatarUrl = (style, seed) =>
    `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(
        seed
    )}`;

const AVATARS = AVATAR_STYLES.flatMap(
    (style) =>
        AVATAR_SEEDS.slice(0, 4).map(
            (seed) => ({
                id: `${style}-${seed}`,
                style,
                seed,
                url: generateAvatarUrl(
                    style,
                    seed
                ),
            })
        )
);

const InviteMemberDialog = ({
    isDialogOpen,
    setIsDialogOpen,
    onMemberAdded,
}) => {
    const currentWorkspace = useSelector(
        (state) =>
            state.workspace?.currentWorkspace ||
            null
    );

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [showAvatars, setShowAvatars] =
        useState(false);

    const [selectedAvatar, setSelectedAvatar] =
        useState(AVATARS[0]);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "MEMBER",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleAvatarSelect = (avatar) => {
        setSelectedAvatar(avatar);
        setShowAvatars(false);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            role: "MEMBER",
        });

        setSelectedAvatar(AVATARS[0]);
        setShowAvatars(false);
    };

    const handleClose = () => {
        if (isSubmitting) return;

        resetForm();
        setIsDialogOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentWorkspace) {
            toast.error(
                "Please select a workspace."
            );
            return;
        }

        if (!formData.name.trim()) {
            toast.error("Name is required.");
            return;
        }

        if (!formData.email.trim()) {
            toast.error("Email is required.");
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await fetch(
                `${API_URL}/workspaces/${currentWorkspace.id}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        workspaceId:
                            currentWorkspace.id,
                        name: formData.name.trim(),
                        email: formData.email.trim(),
                        role: formData.role,
                        image: selectedAvatar.url,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to add team member."
                );
            }

            toast.success(
                "Team member added successfully."
            );

            resetForm();
            setIsDialogOpen(false);

            if (onMemberAdded) {
                await onMemberAdded();
            }
        } catch (error) {
            console.error(
                "Invitation error:",
                error
            );

            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isDialogOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur flex items-center justify-center z-50 px-4">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-6 w-full max-w-lg text-zinc-900 dark:text-zinc-200 max-h-[90vh] overflow-y-auto">

                <div className="mb-5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <UserPlus className="size-5" />
                        Invite Team Member
                    </h2>

                    {currentWorkspace && (
                        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-400">
                            Inviting to workspace:{" "}
                            <span className="text-blue-600 dark:text-blue-400">
                                {currentWorkspace.name}
                            </span>
                        </p>
                    )}
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    <div className="space-y-2">
                        <label
                            htmlFor="name"
                            className="text-sm font-medium"
                        >
                            Employee Name
                        </label>

                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 size-4" />

                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter employee name"
                                className="pl-10 w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm py-2.5 focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="email"
                            className="text-sm font-medium"
                        >
                            Email Address
                        </label>

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 size-4" />

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email address"
                                className="pl-10 w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm py-2.5 focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium">
                            Choose Avatar
                        </label>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowAvatars(
                                        (previous) =>
                                            !previous
                                    )
                                }
                                className="w-full flex items-center justify-between border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={
                                            selectedAvatar.url
                                        }
                                        alt="Selected avatar"
                                        className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800"
                                    />

                                    <div className="text-left">
                                        <p className="text-sm font-medium">
                                            Selected Avatar
                                        </p>

                                        <p className="text-xs text-zinc-500">
                                            Click to choose another
                                        </p>
                                    </div>
                                </div>

                                <ChevronDown
                                    className={`size-4 transition-transform ${
                                        showAvatars
                                            ? "rotate-180"
                                            : ""
                                    }`}
                                />
                            </button>

                            {showAvatars && (
                                <div className="absolute z-50 mt-2 w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-xl p-3">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-semibold">
                                            Choose your avatar
                                        </p>

                                        <p className="text-xs text-zinc-500">
                                            {AVATARS.length} options
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-6 gap-2 max-h-72 overflow-y-auto pr-1">
                                        {AVATARS.map(
                                            (avatar) => {
                                                const isSelected =
                                                    selectedAvatar.id ===
                                                    avatar.id;

                                                return (
                                                    <button
                                                        key={
                                                            avatar.id
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            handleAvatarSelect(
                                                                avatar
                                                            )
                                                        }
                                                        className={`relative rounded-full p-1 transition-all hover:scale-110 ${
                                                            isSelected
                                                                ? "ring-2 ring-blue-500"
                                                                : "hover:ring-2 hover:ring-zinc-300 dark:hover:ring-zinc-600"
                                                        }`}
                                                    >
                                                        <img
                                                            src={
                                                                avatar.url
                                                            }
                                                            alt="Avatar"
                                                            className="w-full aspect-square rounded-full bg-zinc-100 dark:bg-zinc-800"
                                                        />

                                                        {isSelected && (
                                                            <span className="absolute bottom-0 right-0 size-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950">
                                                                <Check className="size-3 text-white" />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="role"
                            className="text-sm font-medium"
                        >
                            Role
                        </label>

                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm py-2.5 px-3 focus:outline-none focus:border-blue-500"
                        >
                            <option value="MEMBER">
                                Member
                            </option>

                            <option value="ADMIN">
                                Admin
                            </option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-5 py-2 rounded text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                !currentWorkspace
                            }
                            className="px-5 py-2 rounded text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white disabled:opacity-50 hover:opacity-90 transition"
                        >
                            {isSubmitting
                                ? "Adding..."
                                : "Add Member"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteMemberDialog;