/**
 * Example Component showing how to use the Language Toggle feature
 * 
 * This is a complete example demonstrating:
 * 1. Importing the necessary hooks and components
 * 2. Using the translation function
 * 3. Adding the language toggle to the UI
 * 4. Implementing bilingual content
 */

import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Example: Simple page with language support
export const ExamplePage = () => {
  // Step 1: Get the translation function
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Language Toggle */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">{t('common.home')}</h1>
          
          {/* Step 2: Add the Language Toggle Component */}
          <LanguageToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Example 1: Simple text translation */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">
              {t('dashboard.welcome')}
            </h2>
            <p className="text-muted-foreground">
              Current language: {language === 'en' ? 'English' : 'हिंदी'}
            </p>
          </Card>

          {/* Example 2: Form with translations */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              {t('auth.signIn')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  placeholder={t('auth.email')}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  placeholder={t('auth.password')}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <Button className="w-full">
                {t('common.submit')}
              </Button>
            </div>
          </Card>

          {/* Example 3: Action buttons */}
          <Card className="p-6">
            <div className="flex gap-4">
              <Button variant="default">
                {t('common.save')}
              </Button>
              <Button variant="outline">
                {t('common.cancel')}
              </Button>
              <Button variant="destructive">
                {t('common.delete')}
              </Button>
            </div>
          </Card>

          {/* Example 4: Status badges */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              {t('dashboard.status')}
            </h3>
            <div className="flex gap-4">
              <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">
                {t('dashboard.pending')}
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded">
                {t('dashboard.approved')}
              </div>
              <div className="px-3 py-1 bg-red-100 text-red-800 rounded">
                {t('dashboard.rejected')}
              </div>
            </div>
          </Card>

          {/* Example 5: Using translation in dynamic content */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              {t('admin.manageUsers')}
            </h3>
            <div className="space-y-2">
              {['user1', 'user2', 'user3'].map((user, index) => (
                <div key={user} className="flex items-center justify-between p-3 border rounded-lg">
                  <span>{`User ${index + 1}`}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      {t('common.edit')}
                    </Button>
                    <Button size="sm" variant="destructive">
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

// ============================================
// Example: Component with conditional content
// ============================================

export const ExampleConditionalComponent = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);

  return (
    <div>
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p>{t('dashboard.welcome')}</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// Example: Using translations in toast messages
// ============================================

import { toast } from "sonner";
import { useState } from "react";

export const ExampleWithToast = () => {
  const { t } = useLanguage();

  const handleSave = () => {
    try {
      // Your save logic here
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = () => {
    toast.error(t('common.areYouSure'));
  };

  return (
    <div>
      <Button onClick={handleSave}>{t('common.save')}</Button>
      <Button onClick={handleDelete}>{t('common.delete')}</Button>
    </div>
  );
};

// ============================================
// Example: Table with translations
// ============================================

export const ExampleTable = () => {
  const { t } = useLanguage();

  const employees = [
    { name: "John", role: "Manager", status: "active" },
    { name: "Jane", role: "Staff", status: "pending" },
  ];

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>{t('dashboard.applicantName')}</th>
          <th>{t('dashboard.position')}</th>
          <th>{t('dashboard.status')}</th>
          <th>{t('dashboard.action')}</th>
        </tr>
      </thead>
      <tbody>
        {employees.map((emp, index) => (
          <tr key={index}>
            <td>{emp.name}</td>
            <td>{emp.role}</td>
            <td>
              {emp.status === 'active' 
                ? t('dashboard.approved') 
                : t('dashboard.pending')}
            </td>
            <td>
              <Button size="sm">{t('common.view')}</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ============================================
// Tips for using translations effectively:
// ============================================

/**
 * 1. ALWAYS use t() function for user-facing text
 *    ❌ Bad:  <button>Save</button>
 *    ✅ Good: <button>{t('common.save')}</button>
 * 
 * 2. Use semantic key names
 *    ❌ Bad:  t('text1'), t('button2')
 *    ✅ Good: t('auth.email'), t('common.submit')
 * 
 * 3. Group related translations
 *    ✅ auth.email, auth.password, auth.signIn
 *    ✅ dashboard.title, dashboard.stats, dashboard.view
 * 
 * 4. Keep placeholders in English for technical terms
 *    const email = "user@example.com"; // Don't translate
 *    <p>{t('auth.emailSentTo')}: {email}</p>
 * 
 * 5. Test both languages
 *    - Switch to Hindi and verify all text displays correctly
 *    - Check for text overflow or layout issues
 * 
 * 6. Add new translations to LanguageContext.tsx
 *    - Add to both 'en' and 'hi' objects
 *    - Keep the same key structure
 */

export default ExamplePage;
