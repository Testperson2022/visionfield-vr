// Minimal Unity Engine stubs for offline compilation check.
// NOT shipped — only used by .build-check to verify syntax without Unity Editor.

namespace UnityEngine
{
    public class Object
    {
        public string name;
        public static void DestroyImmediate(Object obj) { }
        public static T[] FindObjectsOfType<T>() where T : Object => new T[0];
    }

    public class Component : Object
    {
        public GameObject gameObject;
        public Transform transform;
    }

    public class Behaviour : Component
    {
        public bool enabled;
    }

    public class MonoBehaviour : Behaviour
    {
        public Coroutine StartCoroutine(System.Collections.IEnumerator routine) => null;
        public void StopCoroutine(Coroutine routine) { }
        public void StopAllCoroutines() { }
    }

    public class GameObject : Object
    {
        public Transform transform = new Transform();
        public GameObject() { }
        public GameObject(string name) { this.name = name; }
        public void SetActive(bool active) { }
        public T AddComponent<T>() where T : Component, new() => new T();
    }

    public class Transform : Component
    {
        public Vector3 position;
        public Quaternion rotation = Quaternion.identity;
        public Vector3 localPosition;
        public Vector3 localScale;
    }

    public class Coroutine { }

    public struct Vector3
    {
        public float x, y, z;
        public Vector3(float x, float y, float z) { this.x = x; this.y = y; this.z = z; }
        public static Vector3 one => new Vector3(1, 1, 1);
        public static Vector3 zero => new Vector3(0, 0, 0);
        public static Vector3 forward => new Vector3(0, 0, 1);
        public Vector3 normalized { get { float m = (float)System.Math.Sqrt(x*x+y*y+z*z); return m < 1e-6f ? zero : new Vector3(x/m, y/m, z/m); } }
        public static Vector3 Normalize(Vector3 v) { return v.normalized; }
        public static Vector3 operator *(Vector3 v, float f) => new Vector3(v.x * f, v.y * f, v.z * f);
        public static Vector3 operator -(Vector3 a, Vector3 b) => new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
        public static bool operator ==(Vector3 a, Vector3 b) => a.x == b.x && a.y == b.y && a.z == b.z;
        public static bool operator !=(Vector3 a, Vector3 b) => !(a == b);
        public override bool Equals(object obj) => obj is Vector3 v && this == v;
        public override int GetHashCode() => x.GetHashCode() ^ y.GetHashCode() ^ z.GetHashCode();
    }

    public struct Quaternion
    {
        public float x, y, z, w;
        public Quaternion(float x, float y, float z, float w) { this.x = x; this.y = y; this.z = z; this.w = w; }
        public static Quaternion identity => new Quaternion(0, 0, 0, 1);

        public static Quaternion Euler(float x, float y, float z)
        {
            float cx = (float)System.Math.Cos(x * 0.5f * 0.0174533f);
            float sx = (float)System.Math.Sin(x * 0.5f * 0.0174533f);
            float cy = (float)System.Math.Cos(y * 0.5f * 0.0174533f);
            float sy = (float)System.Math.Sin(y * 0.5f * 0.0174533f);
            float cz = (float)System.Math.Cos(z * 0.5f * 0.0174533f);
            float sz = (float)System.Math.Sin(z * 0.5f * 0.0174533f);
            return new Quaternion(
                sx * cy * cz + cx * sy * sz,
                cx * sy * cz - sx * cy * sz,
                cx * cy * sz + sx * sy * cz,
                cx * cy * cz - sx * sy * sz);
        }

        public static Quaternion Inverse(Quaternion q)
        {
            float lenSq = q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w;
            if (lenSq < 1e-12f) return identity;
            float inv = 1f / lenSq;
            return new Quaternion(-q.x * inv, -q.y * inv, -q.z * inv, q.w * inv);
        }

        public static Vector3 operator *(Quaternion q, Vector3 v)
        {
            float qx2 = q.x * 2f, qy2 = q.y * 2f, qz2 = q.z * 2f;
            float xx = q.x * qx2, yy = q.y * qy2, zz = q.z * qz2;
            float xy = q.x * qy2, xz = q.x * qz2, yz = q.y * qz2;
            float wx = q.w * qx2, wy = q.w * qy2, wz = q.w * qz2;
            return new Vector3(
                (1f - (yy + zz)) * v.x + (xy - wz) * v.y + (xz + wy) * v.z,
                (xy + wz) * v.x + (1f - (xx + zz)) * v.y + (yz - wx) * v.z,
                (xz - wy) * v.x + (yz + wx) * v.y + (1f - (xx + yy)) * v.z);
        }
    }

    public struct Color
    {
        public float r, g, b, a;
        public Color(float r, float g, float b, float a) { this.r = r; this.g = g; this.b = b; this.a = a; }
        public static Color white => new Color(1, 1, 1, 1);
        public static Color operator *(Color c, float f) => new Color(c.r * f, c.g * f, c.b * f, c.a);
    }

    public static class Mathf
    {
        public const float Deg2Rad = 0.0174532924f;
        public static float Clamp(float v, float min, float max) => v < min ? min : v > max ? max : v;
        public static int Clamp(int v, int min, int max) => v < min ? min : v > max ? max : v;
        public static float Tan(float f) => (float)System.Math.Tan(f);
        public static float Pow(float b, float e) => (float)System.Math.Pow(b, e);
        public static float Log10(float f) => (float)System.Math.Log10(f);
        public static float Abs(float f) => System.Math.Abs(f);
        public static int RoundToInt(float f) => (int)System.Math.Round(f);
    }

    public static class JsonUtility
    {
        public static string ToJson(object obj) => "{}";
        public static T FromJson<T>(string json) => System.Activator.CreateInstance<T>();
    }

    public static class Time
    {
        public static float realtimeSinceStartup => 0f;
    }

    public static class Debug
    {
        public static void Log(string msg) { }
        public static void LogWarning(string msg) { }
        public static void LogError(string msg) { }
    }

    public class MeshRenderer : Component
    {
        public Material material = new Material();
    }

    public class Material
    {
        public void SetColor(string name, Color color) { }
        public void EnableKeyword(string keyword) { }
    }

    public static class Input
    {
        public static bool GetKeyDown(KeyCode key) => false;
    }

    public enum KeyCode { Space, Escape, Return }

    public class SerializeFieldAttribute : System.Attribute { }
    public class HeaderAttribute : System.Attribute { public HeaderAttribute(string h) { } }
    public class TooltipAttribute : System.Attribute { public TooltipAttribute(string t) { } }
}

namespace UnityEngine.UI
{
    public class Text : UnityEngine.Component
    {
        public string text;
        public UnityEngine.Color color;
    }

    public class Image : UnityEngine.Component
    {
        public UnityEngine.Color color;
    }
}

namespace NUnit.Framework
{
    [System.AttributeUsage(System.AttributeTargets.Class)]
    public class TestFixtureAttribute : System.Attribute { }

    [System.AttributeUsage(System.AttributeTargets.Method)]
    public class TestAttribute : System.Attribute { }

    [System.AttributeUsage(System.AttributeTargets.Method)]
    public class SetUpAttribute : System.Attribute { }

    [System.AttributeUsage(System.AttributeTargets.Method)]
    public class TearDownAttribute : System.Attribute { }

    public static class Assert
    {
        public static void IsTrue(bool condition, string msg = "") { }
        public static void IsFalse(bool condition, string msg = "") { }
        public static void IsNotNull(object obj, string msg = "") { }
        public static void AreEqual(object expected, object actual, string msg = "") { }
        public static void AreEqual(float expected, float actual, float delta, string msg = "") { }
        public static void AreEqual(double expected, double actual, double delta, string msg = "") { }
        public static void Less(double a, double b, string msg = "") { }
        public static void Less(int a, int b, string msg = "") { }
        public static void Greater(double a, double b, string msg = "") { }
        public static void Greater(float a, float b, string msg = "") { }
        public static void Greater(int a, int b, string msg = "") { }
        public static void LessOrEqual(int a, int b, string msg = "") { }
        public static void LessOrEqual(double a, double b, string msg = "") { }
        public static void GreaterOrEqual(double a, double b, string msg = "") { }
        public static void Throws<T>(TestDelegate code) where T : System.Exception { }
        public delegate void TestDelegate();
    }
}
